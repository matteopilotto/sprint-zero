// Demo data. Run with `node seed.js` from this folder.
// Creates the tables if needed, one demo user, and three demo recordings, each a copy
// of the small sample video in fixtures/. Safe to run again: it resets the demo
// account's recordings and leaves every other account alone. Needs no internet.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db'); // also creates the schema and the recordings folder
const { timestamp, filePathFor } = require('./lib/helpers');

const DEMO_EMAIL = 'dana.okafor@brightlane.io';
const DEMO_PASSWORD = 'walkthrough-2026';

// fixtures/demo.webm is a 5-second VP9 + Opus clip (640x360).
// The length below is the file's real length, so the library matches the player.
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'demo.webm');
const FIXTURE_DURATION_SECONDS = 5;

const HOUR = 60 * 60 * 1000;
const ago = (ms) => timestamp(new Date(Date.now() - ms));

const DEMO_RECORDINGS = [
  {
    id: 'b3e9a6c2-58d1-4f7e-8c0a-1d2e3f4a5b6c',
    title: 'Onboarding walkthrough v2',
    mode: 'screen_camera',
    created_at: ago(2 * HOUR),
    updated_at: ago(1.5 * HOUR), // renamed after it was recorded
  },
  {
    id: '5a8c2e17-9b3f-4d60-a7e4-c1f08b6d3e92',
    title: 'Bug report — invoice export times out',
    mode: 'screen',
    created_at: ago(26 * HOUR),
    updated_at: ago(25.8 * HOUR),
  },
  {
    id: '0f4d7a91-3c2b-4e6d-b8a5-9e1c7f2d4a60',
    title: 'Q4 roadmap review for design',
    mode: 'screen_camera',
    created_at: ago(4 * 24 * HOUR),
    updated_at: ago(4 * 24 * HOUR),
  },
];

function seedUser() {
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
  if (existing) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, existing.id);
    return existing.id;
  }
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    DEMO_EMAIL,
    passwordHash,
    ago(7 * 24 * HOUR)
  );
  return id;
}

function seedRecordings(userId) {
  // Clear out the demo account's old recordings and their files first.
  const old = db.prepare('SELECT id FROM recordings WHERE user_id = ?').all(userId);
  for (const row of old) fs.rmSync(filePathFor(row.id), { force: true });
  db.prepare('DELETE FROM recordings WHERE user_id = ?').run(userId);

  const insert = db.prepare(
    `INSERT INTO recordings (id, user_id, title, mode, duration_seconds, size_bytes, mime_type, created_at, updated_at)
     VALUES (@id, @user_id, @title, @mode, @duration_seconds, @size_bytes, 'video/webm', @created_at, @updated_at)`
  );
  for (const recording of DEMO_RECORDINGS) {
    const filePath = filePathFor(recording.id);
    fs.copyFileSync(FIXTURE_PATH, filePath);
    insert.run({
      ...recording,
      user_id: userId,
      duration_seconds: FIXTURE_DURATION_SECONDS,
      size_bytes: fs.statSync(filePath).size,
    });
  }
}

const userId = seedUser();
seedRecordings(userId);

console.log('Seed complete.');
console.log(`  Demo recordings: ${DEMO_RECORDINGS.length}`);
console.log(`  Demo email:      ${DEMO_EMAIL}`);
console.log(`  Demo password:   ${DEMO_PASSWORD}`);
