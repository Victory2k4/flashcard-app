const { Pool } = require('pg');

// Neon.tech (và mọi PostgreSQL provider) dùng DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon yêu cầu SSL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper: chạy query dễ dàng hơn
const query = (text, params) => pool.query(text, params);

// Khởi tạo schema khi server start
async function setupDatabase() {
  await pool.query(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      streak INTEGER DEFAULT 0,
      last_study_date TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Decks table
    CREATE TABLE IF NOT EXISTS decks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_public INTEGER DEFAULT 0,
      color TEXT DEFAULT '#6366f1',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Cards table
    CREATE TABLE IF NOT EXISTS cards (
      id SERIAL PRIMARY KEY,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      term TEXT NOT NULL,
      phonetic TEXT DEFAULT '',
      part_of_speech TEXT DEFAULT '',
      definition TEXT NOT NULL,
      example_sentence TEXT DEFAULT '',
      audio_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- User card progress (Spaced Repetition)
    CREATE TABLE IF NOT EXISTS user_card_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'new',
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      next_review_at TIMESTAMPTZ DEFAULT NOW(),
      last_reviewed_at TIMESTAMPTZ,
      UNIQUE(user_id, card_id)
    );

    -- Study sessions
    CREATE TABLE IF NOT EXISTS study_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      deck_id INTEGER NOT NULL REFERENCES decks(id),
      cards_studied INTEGER DEFAULT 0,
      cards_mastered INTEGER DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ PostgreSQL schema ready');
}

module.exports = { query, pool, setupDatabase };
