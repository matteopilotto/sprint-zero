// Receives the uploaded video for POST /recordings.
// The file is streamed straight to disk (never held in memory) under a UUID that is
// generated before the first byte is written, so it does not matter what order the
// form fields arrive in.
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const { RECORDINGS_DIR, MAX_UPLOAD_BYTES } = require('../config');
const { sendError, extensionFor, filePathFor, removeFiles } = require('./helpers');

const storage = multer.diskStorage({
  destination: RECORDINGS_DIR,
  filename: (req, file, done) => {
    req.recordingId = crypto.randomUUID();
    // A first guess at the ending from what the browser says the file is.
    // keepUpload() corrects it once the whole file is on disk.
    done(null, `${req.recordingId}.${extensionFor(declaredType(file))}`);
  },
});

const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_BYTES } }).single('file');

// Deletes whatever this request wrote to disk. Safe to call when nothing was written.
function removeUpload(req) {
  if (req.recordingId) removeFiles(req.recordingId);
}

// Makes sure the uploaded file has the ending that matches its type:
// "<id>.mp4" for video/mp4, "<id>.webm" otherwise.
function keepUpload(req, mimeType) {
  const finalPath = filePathFor(req.recordingId, mimeType);
  if (finalPath !== req.file.path) {
    fs.renameSync(req.file.path, finalPath);
    req.file.path = finalPath;
  }
}

// What the browser says the file is, without codec details.
function declaredType(file) {
  return String(file.mimetype || '').split(';')[0].trim().toLowerCase();
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

// The content type to store, without codec details: "video/mp4;codecs=avc1.42E01E,mp4a.40.2"
// becomes "video/mp4" and "video/webm;codecs=vp9,opus" becomes "video/webm". Browsers send the codec list with a comma in it, which the
// upload parser cannot read; it then reports "text/plain". When that happens we look
// at the first bytes of the file itself to tell WebM from MP4.
function mimeTypeOf(file) {
  const declared = declaredType(file);
  if (declared && declared !== 'text/plain') return declared;

  const start = Buffer.alloc(12);
  const handle = fs.openSync(file.path, 'r');
  fs.readSync(handle, start, 0, 12, 0);
  fs.closeSync(handle);
  if (start.readUInt32BE(0) === 0x1a45dfa3) return 'video/webm';
  if (start.toString('latin1', 4, 8) === 'ftyp') return 'video/mp4';
  return declared || 'application/octet-stream';
}

module.exports = { receiveUpload, removeUpload, keepUpload, mimeTypeOf };
