# Loom clone — server

The local API for the Loom clone. It keeps accounts and recording details in a SQLite file (`data.db`) and saves each video as a file in `recordings/`. The browser does all the recording; this server only stores and serves the results. Nothing leaves your machine.

**No account, no keys, and no `.env` file are needed.**

## Run it

From this folder:

1. `npm install`
2. `node seed.js` — creates the database, a demo account, and three demo recordings. It prints the demo login:
   - Email: `dana.okafor@brightlane.io`
   - Password: `walkthrough-2026`
3. `node index.js` — starts the API on `http://localhost:3001`.

The seed is safe to run again. It resets the demo account's recordings and leaves other accounts alone. The server also creates the database tables and the `recordings/` folder by itself on start, so the seed is optional.

## What is in here

| File | What it does |
|------|--------------|
| `index.js` | Starts the server, sets up cross-origin access for the frontend, and turns every error into JSON. |
| `config.js` | Port, file locations, and the token secret, all with working defaults. |
| `db.js` | Opens `data.db` and creates the tables if they are missing. |
| `routes/auth.js` | Sign up, log in, and "who am I". |
| `routes/recordings.js` | List, read, save, rename, delete, and serve the video file. |
| `lib/auth.js` | Creates login tokens and checks them on protected routes. |
| `lib/upload.js` | Streams an uploaded video straight to disk (2 GB limit). |
| `lib/helpers.js` | Timestamps, default titles, and the public shape of users and recordings. |
| `seed.js` | Demo data. |
| `fixtures/demo.webm` | A 5-second sample video (VP9 + Opus) the seed copies for each demo recording. |

The endpoints are described in `docs/api-contract.md` at the repo root.

## Optional settings

None of these are required.

- `JWT_SECRET` — the secret used to sign login tokens. Defaults to a built-in development secret.
- `PORT` — defaults to `3001`.
- `MAX_UPLOAD_BYTES` — lowers the 2 GB upload limit, useful only for testing the "file too large" response.

## Good to know

- Login tokens last 7 days. Logging out happens in the browser, which simply discards the token.
- The video link used by the player and the download button carries the token in its address (`?token=`). That is the only route that accepts it, and the server never logs request addresses.
- To start fresh, stop the server, delete `data.db` and the `recordings/` folder, and run `node seed.js` again.
