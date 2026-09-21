-- Foydalanuvchilar jadvali
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id BIGINT UNIQUE NOT NULL,
  name TEXT,
  age INTEGER,
  gender TEXT,
  height REAL,
  weight REAL,
  activity_level TEXT,
  goal TEXT,
  workout_location TEXT,
  workout_days INTEGER DEFAULT 3,
  notifications_enabled INTEGER DEFAULT 1,
  fasting_mode INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tana rasmi tahlili natijalari
CREATE TABLE IF NOT EXISTS body_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  image_reference TEXT,
  analysis TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Bajarilgan mashg'ulotlar tarixi
CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  exercise TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Haftalik va davriy o'zgarishlar (vazn, bel, rasm)
CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  weight REAL NOT NULL,
  waist REAL,
  photo_reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Kunlik ovqatlanish va makrolar yozuvi
CREATE TABLE IF NOT EXISTS nutrition (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  fat REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Har bir iste'mol qilingan taom yozuvi (Food Vision AI)
CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  photo_reference TEXT,
  dish_name TEXT NOT NULL,
  portion_grams REAL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  fat REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
