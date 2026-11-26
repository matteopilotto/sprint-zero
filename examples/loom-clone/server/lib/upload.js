// Receives the uploaded video for POST /recordings.
// The file is streamed straight to disk (never held in memory) under a UUID that is
// generated before the first byte is written, so it does not matter what order the
// form fields arrive in.
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const { RECORDINGS_DIR, MAX_UPLOAD_BYTES } = require('../config');
const { sendError, filePathFor } = require('./helpers');

const storage = multer.diskStorage({
  destination: RECORDINGS_DIR,
  filename: (req, file, done) => {
    req.recordingId = crypto.randomUUID();
    done(null, `${req.recordingId}.webm`);
  },
});

const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_BYTES } }).single('file');

// Deletes whatever this request wrote to disk. Safe to call when nothing was written.
function removeUpload(req) {
  if (req.recordingId) fs.rmSync(filePathFor(req.recordingId), { force: true });
}

function receiveUpload(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    removeUpload(req);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 413, 'file_too_large', 'Recording is larger than the 2 GB limit.');
    }
    if (err instanceof multer.MulterError) {
      return sendError(res, 400, 'invalid_input', 'Upload must be a form with one video in the "file" field.');
    }
    next(err);
  });
}

// The content type to store, without codec details: "video/webm;codecs=vp9,opus"
// becomes "video/webm". Browsers send the codec list with a comma in it, which the
// upload parser cannot read; it then reports "text/plain". When that happens we look
// at the first bytes of the file itself to tell WebM from MP4.
function mimeTypeOf(file) {
  const declared = String(file.mimetype || '').split(';')[0].trim().toLowerCase();
  if (declared && declared !== 'text/plain') return declared;

  const start = Buffer.alloc(12);
  const handle = fs.openSync(file.path, 'r');
  fs.readSync(handle, start, 0, 12, 0);
  fs.closeSync(handle);
  if (start.readUInt32BE(0) === 0x1a45dfa3) return 'video/webm';
  if (start.toString('latin1', 4, 8) === 'ftyp') return 'video/mp4';
  return declared || 'application/octet-stream';
}

module.exports = { receiveUpload, removeUpload, mimeTypeOf };
