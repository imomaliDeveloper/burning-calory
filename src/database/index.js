import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sqliteDb = null;
let pgPool = null;
let isPostgres = false;

/**
 * Ma'lumotlar bazasini initsializatsiya qilish
 */
export async function initDatabase() {
  if (config.databaseUrl && (config.databaseUrl.startsWith('postgres://') || config.databaseUrl.startsWith('postgresql://'))) {
    isPostgres = true;
    pgPool = new pg.Pool({ connectionString: config.databaseUrl });
    console.log('[DATABASE] PostgreSQL ulanishi faollashtirildi.');
  } else {
    // SQLite drayveri (node:sqlite)
    let dbFilePath = config.sqlitePath;
    if (config.databaseUrl && (config.databaseUrl.startsWith('sqlite://') || config.databaseUrl.startsWith('sqlite:'))) {
      const cleanPath = config.databaseUrl.replace(/^sqlite:\/\/|sqlite:/, '');
      dbFilePath = path.resolve(process.cwd(), cleanPath);
    }

    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    sqliteDb = new DatabaseSync(dbFilePath);
    sqliteDb.exec('PRAGMA foreign_keys = ON;');
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
    sqliteDb.exec('PRAGMA busy_timeout = 5000;');
    console.log(`[DATABASE] SQLite ulanishi o'rnatildi: ${dbFilePath}`);
  }

  // Schema faylini o'qish va jadvallarni yaratish
  const schemaPath = path.join(__dirname, 'schema.sql');
  let schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (isPostgres) {
    // Postgres uchun moslashtirish (AUTOINCREMENT -> SERIAL)
    schemaSql = schemaSql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/REAL/gi, 'DOUBLE PRECISION');
    await pgPool.query(schemaSql);
  } else {
    sqliteDb.exec(schemaSql);
  }

  // Mavjud baza uchun migratsiya: notifications_enabled va fasting_mode ustunlarini qo'shish
  try {
    if (isPostgres) {
      await pgPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled INTEGER DEFAULT 1;');
      await pgPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS fasting_mode INTEGER DEFAULT 0;');
    } else {
      sqliteDb.exec('ALTER TABLE users ADD COLUMN notifications_enabled INTEGER DEFAULT 1;');
    }
  } catch (err) {
    // Agar ustun allaqachon mavjud bo'lsa xatolik e'tiborga olinmaydi
  }

  try {
    if (!isPostgres) {
      sqliteDb.exec('ALTER TABLE users ADD COLUMN fasting_mode INTEGER DEFAULT 0;');
    }
  } catch (err) {
    // fasting_mode mavjud bo'lsa e'tiborga olinmaydi
  }

  console.log('[DATABASE] Jadvallar muvaffaqiyatli tekshirildi va initsializatsiya qilindi.');
}

/**
 * Universal SQL so'rov bajarish (bir nechta qator qaytaradi)
 */
export async function query(sql, params = []) {
  if (isPostgres) {
    let pgSql = sql;
    // ? larni $1, $2, ... ga aylantirish
    let idx = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${idx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows;
  } else {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params);
  }
}

/**
 * Bitta qator qaytaradigan so'rov
 */
export async function queryOne(sql, params = []) {
  if (isPostgres) {
    const rows = await query(sql, params);
    return rows[0] || null;
  } else {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...params) || null;
  }
}

/**
 * INSERT, UPDATE, DELETE so'rovlari uchun
 */
export async function execute(sql, params = []) {
  if (isPostgres) {
    let pgSql = sql;
    let idx = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${idx++}`);
    // Oxiriga RETURNING id qo'shish agar INSERT bo'lsa
    if (/^\s*INSERT/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
      pgSql += ' RETURNING id';
    }
    const res = await pgPool.query(pgSql, params);
    return {
      changes: res.rowCount,
      lastInsertRowid: res.rows?.[0]?.id || null,
    };
  } else {
    const stmt = sqliteDb.prepare(sql);
    const info = stmt.run(...params);
    return {
      changes: info.changes,
      lastInsertRowid: Number(info.lastInsertRowid),
    };
  }
}

/**
 * Baza ulanishini xavfsiz yopish
 */
export async function closeDatabase() {
  if (pgPool) {
    await pgPool.end();
  }
  if (sqliteDb) {
    sqliteDb.close();
  }
  console.log('[DATABASE] Baza ulanishi yopildi.');
}
