# Sprint Zero — Scope

## Reference

- **Company URL:** https://www.loom.com
- **Repo URL:** not provided

## Build configuration

- **Project type:** web-app
- **Stack profile:** node-react
- **Data layer:** local

A React+Vite UI talking to an Express API, with recordings metadata and auth stored locally in SQLite and the video files saved on the local machine's disk (no external account needed).

## Build level

**MVP**

Real auth and real data via the local data layer, with the one core loop (record, then manage the recording in a local library) working end-to-end.

## Core loop

A local-first screen recorder that runs in the browser, working like Loom's recorder but with nothing uploaded. The user picks what to record, sees a 3-second countdown, records, stops, and the recording appears in a local library where it can be played, renamed, downloaded, or deleted.

### Recording modes

- Screen only.
- Screen plus camera, with the camera shown as a round bubble over the screen.
- Microphone audio is included in both modes and can be turned off.

### Camera background

- None (the real background).
- Blur.
- Custom image chosen by the user.

### Recording controls

- A 3-second countdown (3, 2, 1) before recording starts.
- A small overlay showing elapsed time (mm:ss) while recording.
- Pause, resume, and stop.

### Storage

- Recordings are saved as video files on the local machine, with title, duration, and creation date stored in the local database.
- No cloud storage, no share links, no third-party services.

## Excludes

- Sharing, comments, reactions, and view analytics.
- Video editing or trimming.
- Transcripts and AI summaries.
- Teams, workspaces, and billing.
- Desktop app or browser extension; this is a web app only.

## Assumptions made during scoping

- [ASSUMED] The user did not mention accounts. Because the level is MVP, the build includes real auth (signup, login, logout) through the local data layer's self-issued JWT, and each user sees only their own recordings.
- [ASSUMED] "Saved on the user's own machine" means the browser sends the finished recording to the Express server running on the same machine, which writes the video file to a local folder next to the SQLite database. Nothing leaves localhost.
- [ASSUMED] "No third-party services" also rules out loading models or scripts from a CDN at runtime. Anything the camera blur or custom background needs must be installed as a local dependency and served by the app itself.
