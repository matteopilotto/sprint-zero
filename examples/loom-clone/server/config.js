// Every setting the server needs, in one place. Nothing here has to be configured:
// each value has a default that works straight after `npm install`.
const path = require('path');

module.exports = {
  PORT: Number(process.env.PORT) || 3001,
  CLIENT_ORIGIN: 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'sprint-zero-dev-secret',
  TOKEN_LIFETIME: '7d',
  DB_PATH: path.join(__dirname, 'data.db'),
  RECORDINGS_DIR: path.join(__dirname, 'recordings'),
  // 2 GB upload cap. The env override exists only so the limit can be tested with a small file.
  MAX_UPLOAD_BYTES: Number(process.env.MAX_UPLOAD_BYTES) || 2 * 1024 * 1024 * 1024,
};
