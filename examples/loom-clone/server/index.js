// Loom clone API. Run with `node index.js`; listens on http://localhost:3001.
// Request URLs are deliberately never logged: file links carry the login token.
const express = require('express');
const cors = require('cors');
require('./db'); // creates the tables and the recordings folder if they are missing
const { PORT, CLIENT_ORIGIN } = require('./config');
const { sendError } = require('./lib/helpers');

const app = express();
app.disable('x-powered-by');

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    exposedHeaders: ['Content-Disposition'],
  })
);
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/recordings', require('./routes/recordings'));

// Unknown routes get the same JSON error shape as everything else.
app.use((req, res) => sendError(res, 404, 'not_found', 'Route not found.'));

// Last stop for anything that went wrong, so Express never sends its HTML error page.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'invalid_input', 'Request body must be valid JSON.');
  }
  if (err.status >= 400 && err.status < 500) {
    return sendError(res, 400, 'invalid_input', 'The request could not be understood.');
  }
  console.error('Unexpected error:', err.message);
  sendError(res, 500, 'server_error', 'Something went wrong.');
});

app.listen(PORT, () => {
  console.log(`Loom clone API listening on http://localhost:${PORT}`);
});
