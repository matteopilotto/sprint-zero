# Looky

Looky is a local-first screen recorder that runs in your browser. The browser does the recording, a small server running on your own machine stores the video files, and nothing leaves your machine: no cloud storage, no share links, no third-party services.

You pick what to record, see a 3-second countdown, record, and stop. The recording then appears in your library, where you can play it, rename it, download it, or delete it.

## What it does

### Recording

- Three recording modes: "Screen only", "Screen + camera" (the camera is a round bubble over the screen), and "Camera only" (the camera fills the whole frame).
- "Microphone" can be switched on or off before recording. It starts switched on.
- "Computer audio" adds the sound your computer is playing, in the two screen modes, when you share audio in the browser's share prompt.
- "Video quality" offers "720p", "1080p", and "Original" (the size the browser captured, up to 3840 by 2160). It starts at "1080p".
- A 3, 2, 1 countdown runs before recording starts, and a small overlay shows the elapsed time as mm:ss while recording.
- "Pause", "Resume", "Stop", and "Cancel". "Stop" saves the recording and takes you to the library; "Cancel" discards the take after a confirmation.
- "Floating controls": a small window that stays on top of other tabs and apps, with the timer, "Pause", "Resume", "Stop", and "Cancel".
- "Media key shortcuts": the keyboard's Play/Pause key pauses and resumes, and the Next track key stops and saves, from any tab or app.
- The recorder remembers your last choices in the same browser.

### Camera

- "Camera background": "None", "Blur", or "Custom image" (picked with the "Choose image" button).
- "Mirror camera" flips the camera left to right, in the preview and in the saved video.
- "Camera view" offers "Show", "Dim", and "Hide". This only changes what you see on the recorder page; the saved video is unaffected.
- "Bubble position" picks the corner the bubble sits in, in "Screen + camera": "Bottom left", "Bottom right", "Top left", or "Top right".
- "Camera view size" offers "Small", "Medium", and "Large" in "Camera only". The saved video is always the full camera frame.

### Library

- "Your recordings" lists your own recordings, newest first. Each account sees only its own.
- A "View" control switches between "List" (rows with title, duration, and creation date) and "Grid" (cards with a thumbnail, a length badge, the recording's age, and its title).
- Click a title or a thumbnail to open the recording's page and play it.
- "Rename", "Download", and "Delete" are icon buttons in the library and on the recording page. "Delete" asks for confirmation first.
- New recordings are saved and downloaded as `.mp4` files (H.264 video and AAC sound).

### Accounts

- "Sign up" and "Log in" with an email and a password, and "Log out" in the header. Accounts live only in the local database.

## What it leaves out on purpose

- Sharing, comments, reactions, and view analytics.
- Video editing or trimming.
- Transcripts and AI summaries.
- Teams, workspaces, and billing.
- A desktop app or browser extension. Looky is a web app only.

## Requirements

- Node.js 22.12 or newer, with npm.
- A desktop Chromium-based browser for recording, such as Brave, Chrome, or Edge. These features depend on the browser:
  - The floating controls need a browser that offers a picture-in-picture window for web pages. Where it is missing, the "Floating controls" toggle is not shown.
  - Computer audio depends on the browser's share prompt offering an audio option. A single shared window carries no audio.
  - MP4 recording depends on the browser. If the browser cannot record MP4, Looky records WebM and converts it to MP4 after "Stop"; if that also fails, the recording is saved as a `.webm` file and is never lost.

No account, no keys, and no `.env` file are needed.

## Getting started

Run these from the build folder (the folder this README is in). The server and the client each need their own terminal.

1. Install the server's dependencies and, on a first run only, create the demo account:

   ```bash
   cd server
   npm install
   node seed.js
   ```

2. Start the server. It listens on `http://localhost:3001`:

   ```bash
   node index.js
   ```

3. In a second terminal, from the build folder, install and start the client. It listens on `http://localhost:5173`:

   ```bash
   cd client
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser and log in.

Demo login:

- Email: `dana.okafor@brightlane.io`
- Password: `walkthrough-2026`

`node seed.js` is for a first run only. It creates the demo account and three demo recordings, and every time it runs it resets the demo account's recordings: anything you recorded while logged in as the demo account is deleted. Other accounts are left alone. The seed is also optional, because the server creates its database and its `recordings/` folder by itself when it starts; without the seed there is no demo account, so use "Sign up" to create your own.

## Where your data lives

- Accounts and recording details (title, duration, creation date) are in `server/data.db`, a SQLite file.
- The video files are in `server/recordings/`, one file per recording.

Both are ignored by git, so they are never committed and a git commit is not a backup of them.

To back up, stop the server and copy `server/data.db` and the `server/recordings/` folder together. They belong together: the database says which file is which recording.

To start fresh, stop the server, delete `server/data.db` and the `server/recordings/` folder, then start the server again. Run `node seed.js` in `server/` first if you want the demo account back.

Your recorder settings, your "View" choice, and your login are kept in the browser, not on the server.

## How the build is laid out

```
server/   the local API: accounts, recording details, and the video files
client/   the React app: login, the recorder, and the library
docs/     the spec set, the build notes, and the issues
```

Under `server/`:

- `routes/` holds the endpoints: sign up, log in, and everything about recordings.
- `lib/` holds the helpers for login tokens, uploads, and the shape of the data sent back.
- `fixtures/` holds the small sample video the seed copies for the demo recordings.
- `tests/` holds the API tests.

`server/README.md` has the server's own file-by-file list.

Under `client/src/`:

- `api/` holds every call the app makes to the server.
- `auth/` holds the login and sign-up pages, the session, and the wrapper that protects signed-in pages.
- `pages/` holds the three screens: the library, the recorder, and the recording page.
- `components/` holds the pieces those screens are built from, such as the setup controls, the camera view, the floating controls, and the recording icons.
- `recorder/` holds the capture code: the camera, the picture that is recorded, sound mixing, video quality, media keys, and the MP4 conversion.

## Optional settings

None of these are required. They are environment variables read by `server/config.js`.

| Setting | Default | What it does |
|---------|---------|--------------|
| `JWT_SECRET` | `sprint-zero-dev-secret` | The secret used to sign login tokens. |
| `PORT` | `3001` | The port the server listens on. |
| `MAX_UPLOAD_BYTES` | `2147483648` (2 GB) | The largest video the server accepts. Lowering it is useful only for testing the "file too large" response. |

The client always calls the server at `http://localhost:3001`, so leave `PORT` alone for normal use. The server only accepts requests from the client at `http://localhost:5173`.

## Tests

The build has one test file, `server/tests/integration.test.js`, which checks the API: accounts, saving, listing, renaming, deleting, and serving recordings. It needs a running server whose database has just been seeded, it creates two throwaway accounts that stay behind, and it expects the demo account to hold exactly the three seeded recordings. So do not run it against a `server/` that holds your own library. Run it against a temporary copy instead, from the build folder:

```bash
rsync -a --exclude 'data.db*' --exclude 'recordings' server/ /tmp/looky-server-test/
cd /tmp/looky-server-test
node seed.js
PORT=3101 node index.js
```

Then, in a second terminal:

```bash
cd /tmp/looky-server-test
API_URL=http://localhost:3101 node tests/integration.test.js
```

Each check prints `PASS` or `FAIL`, and the last lines give the total (`126/126 passed` at the time of writing). Stop the copy's server with Ctrl+C and delete `/tmp/looky-server-test` when you are done.

On a fresh clone with nothing of your own in it, the short form works too: with the seeded server running on port 3001, run `node tests/integration.test.js` from `server/`.

These tests do not open a browser. Capture, the camera, playback, and download can only be checked by hand in a browser.

## Troubleshooting

**A port is already in use.** The server or the client may already be running. Check with:

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

The client must be the only thing on port 5173. The server only allows that one address, so the client refuses to start on any other port, and anything else listening on 5173 makes `http://localhost:5173` show the wrong app.

**A change to the server does nothing.** Restart the server after changing anything in `server/`: stop it with Ctrl+C and run `node index.js` again. The client reloads by itself.

**The browser asks for permission, or recording will not start.** The browser asks before sharing the screen, the camera, and the microphone. If you blocked one, Looky tells you which: "Camera access is blocked. Allow it in your browser's site settings, then try again." or "Microphone access is blocked. Allow it in your browser's site settings, or turn the microphone off." Allow it in the browser's site settings for `http://localhost:5173` and try again. On a Mac, the browser itself also needs permission for screen recording, the camera, and the microphone in System Settings, under Privacy & Security.

**"Screen recording isn't supported in this browser."** Use a desktop Chromium-based browser.

**A very long recording.** A take is held in the browser's memory until "Stop", so a very long recording can use a lot of memory, and closing or reloading the recorder tab loses the take. Record long sessions in parts. The server accepts files up to 2 GB.

**The save failed after "Stop".** The take is kept on the page. Make sure the server is running, then click "Try again", or click "Download instead" to save the file yourself.

## About this build

Looky is a Sprint Zero build: it was generated from a reference URL and a short scoping conversation, then changed in small batches.

- The spec set is in `docs/`: `scope.md`, `reference-brief.md`, `prd.md`, `decisions.md`, `user-stories.md`, and `api-contract.md`.
- `docs/build-notes.md` holds the house rules for working on this build and what earlier batches learned about it.
- `docs/issues/` holds one file per change, with what was asked, what was built, and its status.

Changes go through the refine command, run in Claude Code from the Sprint Zero repo root:

```
/sprint-zero-refine examples/loom-clone <your requests>
```

Do not re-run `/sprint-zero` for this build. It generates a product from scratch.
