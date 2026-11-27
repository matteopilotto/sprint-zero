// Small shared helpers: timestamps, error responses, titles, and file locations.
const fs = require('fs');
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

// The file ending for a recording: "mp4" for an MP4, "webm" for everything else.
// Used for the file on disk and for the name of a download.
function extensionFor(mimeType) {
  return mimeType === 'video/mp4' ? 'mp4' : 'webm';
}

// Where a recording's video lives on disk. Never sent to the client.
function filePathFor(id, mimeType) {
  return path.join(RECORDINGS_DIR, `${id}.${extensionFor(mimeType)}`);
}

// The file for a saved recording. Everything saved before MP4 support is "<id>.webm"
// whatever its type, so if the expected file is not there the other ending is tried.
function storedFilePath(row) {
  const expected = filePathFor(row.id, row.mime_type);
  if (fs.existsSync(expected)) return expected;
  const other = filePathFor(row.id, row.mime_type === 'video/mp4' ? 'video/webm' : 'video/mp4');
  return fs.existsSync(other) ? other : expected;
}

// Deletes a recording's video, whichever ending it was saved with. Fine if it is already gone.
function removeFiles(id) {
  fs.rmSync(filePathFor(id, 'video/mp4'), { force: true });
  fs.rmSync(filePathFor(id, 'video/webm'), { force: true });
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

module.exports = {
  timestamp,
  sendError,
  defaultTitle,
  extensionFor,
  filePathFor,
  storedFilePath,
  removeFiles,
  toRecording,
  toUser,
};
