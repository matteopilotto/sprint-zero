// Opens the SQLite file and makes sure the tables and the recordings folder exist.
// This runs whenever the server or the seed script starts, so there is no migration step.
const fs = require('fs');
const Database = require('better-sqlite3');
const { DB_PATH, RECORDINGS_DIR } = require('./config');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recordings (
    id               TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    mode             TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    size_bytes       INTEGER NOT NULL,
    mime_type        TEXT NOT NULL,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS recordings_by_user ON recordings (user_id, created_at);
`);

fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

module.exports = db;
