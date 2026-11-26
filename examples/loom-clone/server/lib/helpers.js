// Small shared helpers: timestamps, error responses, titles, and file locations.
const path = require('path');
const { RECORDINGS_DIR } = require('../config');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ISO 8601 in UTC with no milliseconds, e.g. "2026-11-26T14:32:51Z".
function timestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// Every error the API sends has this shape.
function sendError(res, status, error, message) {
  return res.status(status).json({ error, message });
}

// "Recording — 26 Nov 2026, 14:32" in the server's local time.
function defaultTitle(date = new Date()) {
  const two = (n) => String(n).padStart(2, '0');
  const day = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return `Recording — ${day}, ${two(date.getHours())}:${two(date.getMinutes())}`;
}

// Where a recording's video lives on disk. Never sent to the client.
function filePathFor(id) {
  return path.join(RECORDINGS_DIR, `${id}.webm`);
}

// The public shape of a recording: no user_id and no disk path.
function toRecording(row) {
  return {
    id: row.id,
    title: row.title,
    mode: row.mode,
    duration_seconds: row.duration_seconds,
    size_bytes: row.size_bytes,
    mime_type: row.mime_type,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// The public shape of a user: no password_hash.
function toUser(row) {
  return { id: row.id, email: row.email, created_at: row.created_at };
}

module.exports = { timestamp, sendError, defaultTitle, filePathFor, toRecording, toUser };
