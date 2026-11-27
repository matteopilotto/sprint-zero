// The library: list, read, save, rename, delete, and serve the video file.
// Every query filters by the signed-in user's id, so someone else's recording
// looks exactly like one that does not exist (404).
const fs = require('fs');
const express = require('express');
const db = require('../db');
const { requireAuth, requireAuthForFile } = require('../lib/auth');
const { receiveUpload, removeUpload, keepUpload, mimeTypeOf } = require('../lib/upload');
const {
  timestamp,
  sendError,
  defaultTitle,
  extensionFor,
  storedFilePath,
  removeFiles,
  toRecording,
} = require('../lib/helpers');

const router = express.Router();
const MODES = ['screen', 'screen_camera', 'camera'];
const MAX_TITLE_LENGTH = 200;

function findOwned(req) {
  return db
    .prepare('SELECT * FROM recordings WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
}

function notFound(res) {
  return sendError(res, 404, 'not_found', 'Recording not found.');
}

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM recordings WHERE user_id = ? ORDER BY created_at DESC, rowid DESC')
    .all(req.user.id);
  res.json({ recordings: rows.map(toRecording) });
});

router.get('/:id', requireAuth, (req, res) => {
  const row = findOwned(req);
  if (!row) return notFound(res);
  res.json({ recording: toRecording(row) });
});

router.post('/', requireAuth, receiveUpload, (req, res) => {
  const body = req.body || {};
  const invalid = (message) => {
    removeUpload(req);
    return sendError(res, 400, 'invalid_input', message);
  };

  if (!req.file) return invalid('A video file is required.');
  const sizeBytes = fs.statSync(req.file.path).size;
  if (sizeBytes === 0) return invalid('The video file is empty.');
  if (!MODES.includes(body.mode)) return invalid('Mode must be "screen", "screen_camera", or "camera".');
  if (!/^\d+$/.test(String(body.duration_seconds ?? '').trim())) {
    return invalid('Duration must be a whole number of seconds, 0 or more.');
  }
  const title = String(body.title ?? '').trim() || defaultTitle();
  if (title.length > MAX_TITLE_LENGTH) return invalid('Title must be 200 characters or fewer.');

  const now = timestamp();
  const row = {
    id: req.recordingId,
    user_id: req.user.id,
    title,
    mode: body.mode,
    duration_seconds: Number(String(body.duration_seconds).trim()),
    size_bytes: sizeBytes,
    mime_type: mimeTypeOf(req.file), // "video/mp4;codecs=avc1.42E01E,mp4a.40.2" is stored as "video/mp4"
    created_at: now,
    updated_at: now,
  };

  try {
    keepUpload(req, row.mime_type); // saved as <id>.mp4 or <id>.webm to match its type
    db.prepare(
      `INSERT INTO recordings (id, user_id, title, mode, duration_seconds, size_bytes, mime_type, created_at, updated_at)
       VALUES (@id, @user_id, @title, @mode, @duration_seconds, @size_bytes, @mime_type, @created_at, @updated_at)`
    ).run(row);
  } catch (err) {
    removeUpload(req);
    throw err;
  }

  res.status(201).json({ recording: toRecording(row) });
});

router.put('/:id', requireAuth, (req, res) => {
  const row = findOwned(req);
  if (!row) return notFound(res);

  const body = req.body || {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return sendError(res, 400, 'invalid_input', "Title can't be empty.");
  if (title.length > MAX_TITLE_LENGTH) {
    return sendError(res, 400, 'invalid_input', 'Title must be 200 characters or fewer.');
  }

  const updated = { ...row, title, updated_at: timestamp() };
  db.prepare('UPDATE recordings SET title = ?, updated_at = ? WHERE id = ?').run(
    updated.title,
    updated.updated_at,
    row.id
  );
  res.json({ recording: toRecording(updated) });
});

router.delete('/:id', requireAuth, (req, res) => {
  const row = findOwned(req);
  if (!row) return notFound(res);

  db.prepare('DELETE FROM recordings WHERE id = ?').run(row.id);
  removeFiles(row.id); // fine if the file is already gone
  res.status(204).end();
});

// "<title>.mp4" or "<title>.webm", to match the recording's type, with characters
// that are unsafe in filenames replaced by "-".
function downloadName(row) {
  return `${row.title.replace(/[/\\:*?"<>|]/g, '-')}.${extensionFor(row.mime_type)}`;
}

// A Content-Disposition header with a plain-ASCII name plus the real name.
// Headers cannot carry characters like the em dash directly, so the real name is
// percent-encoded in filename*= and browsers that understand it use that one.
function attachmentHeader(name) {
  const ascii = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // drop accents: "é" becomes "e"
    .replace(/[^\x20-\x7e]/g, '-');
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

// The video itself. sendFile handles Range requests (206) so the player can seek.
router.get('/:id/file', requireAuthForFile, (req, res) => {
  const row = findOwned(req);
  const filePath = row && storedFilePath(row);
  if (!row || !fs.existsSync(filePath)) return notFound(res);

  const headers = { 'Content-Type': row.mime_type };
  if (req.query.download === '1') {
    headers['Content-Disposition'] = attachmentHeader(downloadName(row));
  }

  res.sendFile(filePath, { headers, cacheControl: false }, (err) => {
    if (!err || res.headersSent) return; // sent fine, or the browser stopped listening
    if (err.status === 416) {
      return sendError(res, 416, 'invalid_input', 'Requested range is outside the file.');
    }
    if (err.code === 'ENOENT') return notFound(res);
    sendError(res, 500, 'server_error', 'Something went wrong.');
  });
});

module.exports = router;
