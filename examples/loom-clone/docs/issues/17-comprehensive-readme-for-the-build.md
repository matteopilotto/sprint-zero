# 17: A comprehensive README for the build

Status: built
Batch: 8
Track: straight to code
Area: server

## Request

> add a comprehensive README.md

## Behaviour

- A new file `README.md` sits at the top of the build folder, next to `CLAUDE.md`, headed "Looky". No other file changes: `server/README.md`, `CLAUDE.md`, the spec set, and all code stay as they are.
- It opens with a short description a non-developer can follow: Looky is a local-first screen recorder that runs in the browser, the browser does the recording, a small local server stores the files, and nothing leaves the machine.
- A features section lists what the product does today, matching `docs/user-stories.md` and using its on-screen labels in quotes: the three recording modes ("Screen only", "Screen + camera", "Camera only"), microphone and computer audio, the camera backgrounds and camera options, "Video quality", the countdown, pause, resume, stop and cancel, the floating controls, the media key shortcuts, and the library with its "List" and "Grid" views, playback, "Rename", "Download", and "Delete". It lists nothing the product does not do.
- A section says what Looky leaves out on purpose, matching the "Excludes" list in `docs/scope.md`.
- A requirements section names what is needed to run it: Node.js and npm, and a Chromium-based browser for recording, saying which features depend on the browser (the floating controls, computer audio, and MP4 recording with its WebM fallback). It says that no account, keys, or `.env` file are needed.
- A getting-started section gives numbered steps, with commands that work when copied from the build folder: install and start the server (`http://localhost:3001`), install and start the client (`http://localhost:5173`), and open the client address. It gives the demo login and says that `node seed.js` is for a first run only, because it resets the demo account's recordings.
- A section explains where data lives: accounts and recording details in `server/data.db`, video files in `server/recordings/`, both ignored by git, and how to back up or start fresh.
- A section describes how the build is laid out: `server/`, `client/`, and `docs/`, with one line on what each main folder under `client/src/` and `server/` holds, and a pointer to `server/README.md` for the server's own file list.
- A section lists the optional settings (`JWT_SECRET`, `PORT`, `MAX_UPLOAD_BYTES`) with their defaults, matching `server/config.js`.
- A section says how to run the existing tests, with the command as it really works for `server/tests/integration.test.js`, and that capture, camera, playback, and download can only be checked by hand in a browser.
- A troubleshooting section covers the problems the build notes and the build's `CLAUDE.md` already describe: a port already in use (and that the client must be the only thing on port 5173), the backend needing a restart after server changes, browser permission prompts for the screen, camera, and microphone, and a very long take being held in browser memory until "Stop".
- A section says this is a Sprint Zero build, points to the spec set in `docs/` and the issues in `docs/issues/`, and says that changes go through `/sprint-zero-refine examples/loom-clone <your requests>`.
- Every command, path, port, file name, and label in the README matches the build as it stands. Headings are in sentence case and there are no emoji.

## Spec changes

None.

## Results

Batch 8, 2026-11-27.

**Built by:** backend-engineer. Files changed: `README.md` (new, at the top of the build folder), `docs/build-notes.md` (one constraint appended).

**Checked by QA:** Read the README against the build: all 48 quoted labels and messages are in the client source, the settings and defaults match `server/config.js`, the exclusions match `docs/scope.md`, every folder and file named exists, and only the reported files changed. The README's test instructions were run as written in a temporary copy and passed. Regression: 126/126 existing tests passed against a temporary copy on port 3101; the frontend build passed in a temporary copy.

**Untested:** Everything the README says you see on screen (a house rule forbids driving a browser; labels were checked against the source only). The Node 22.12 lower bound in practice (checked against the dependency ranges only; QA ran Node 22.23.0). The macOS line about System Settings permissions in troubleshooting. `npm install` from a real fresh clone (checked from `package.json` and the lockfile in clean temporary folders). The short test command against a seeded server on port 3001, `npm run dev`, and the backup and start-fresh steps.

**Notes:** QA found two minor inaccuracies, neither against a Behaviour statement. Line 183 quotes only the start of the unsupported-browser message; on screen it reads "Screen recording isn't supported in this browser. Please use desktop Chrome or Edge.", and in "Camera only" it begins "Recording isn't supported in this browser." Lines 142 and 177 say the server only accepts requests from `http://localhost:5173`; that is a cross-origin rule browsers enforce, and the server itself answers other callers. The engineer added a few items beyond the issue's list, all read from the code or the stories: "Bubble position", accounts and remembered settings in the features, a note to leave `PORT` alone because the client always calls `http://localhost:3001`, and troubleshooting entries for the unsupported-browser message and a failed save.

**Click-through:**

- Open `README.md` at the top of the build folder and read it through. It should be headed "Looky", read clearly to a non-developer, and describe the product as you know it.
- In Brave at http://localhost:5173, compare the recorder page with the README's "Recording" and "Camera" lists: "Screen only", "Screen + camera", "Camera only", "Microphone", "Computer audio", "Video quality" ("720p", "1080p", "Original"), "Floating controls", "Media key shortcuts", and with a camera mode chosen "Camera background", "Mirror camera", and "Camera view" ("Show", "Dim", "Hide").
- On "Your recordings", compare the library with the README: the "View" control switches between "List" and "Grid", and the three icons read "Rename", "Download", and "Delete" on hover.
- If you have a spare folder, follow "Getting started" steps 1 to 4 on a fresh clone. The server should print "Looky API listening on http://localhost:3001" and the client should come up on http://localhost:5173.
