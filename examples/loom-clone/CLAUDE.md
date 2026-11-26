# Loom clone — notes for Claude Code

This folder is a Sprint Zero build with three refinement batches on top of its baseline. It is a local-first screen recorder that runs in the browser: the browser captures and encodes the video, and a small local server stores and serves the files.

Configuration: project type `web-app`, stack `node-react`, data layer `local`, level `MVP`.

## Paths

The repo root `CLAUDE.md` describes how Sprint Zero generates builds at the repo root. This build was moved here afterwards, so wherever the root file says `server/`, `client/`, or `docs/`, read `examples/loom-clone/server/`, `examples/loom-clone/client/`, and `examples/loom-clone/docs/`.

Do not re-run `/sprint-zero` for this build: it generates a product from scratch at the repo root, and its `--fresh` and `--rebuild` flags delete specs and code. Changes go through `/sprint-zero-refine examples/loom-clone <your requests>`.

## Where the rest lives

- `docs/build-notes.md` holds the house rules for working on this build and the constraints earlier batches discovered. Read it before changing anything.
- `docs/issues/` holds one file per refinement, with its status, what was asked, what was built, and what the user still needs to try by hand.

## Running it

```bash
cd examples/loom-clone/server && npm install && node index.js   # http://localhost:3001
cd examples/loom-clone/client && npm install && npm run dev      # http://localhost:5173
```

Demo login: `dana.okafor@brightlane.io` / `walkthrough-2026`.

On a fresh clone only, run `node seed.js` in `server/` before the first start to create the demo account. It resets the demo account's recordings, so do not run it against a `server/` that already holds recordings the user may want, without asking first. `server/data.db` and `server/recordings/` are gitignored and hold the user's real library.

Before starting either server, check whether it is already running (`lsof -nP -iTCP:3001 -sTCP:LISTEN`, same for 5173). The frontend must be the only thing on port 5173: a second listener makes `localhost:5173` return the wrong app, and the backend only allows that one origin. Restart the backend after changing server code; the frontend hot-reloads.
