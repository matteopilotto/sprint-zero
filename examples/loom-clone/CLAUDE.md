# Loom clone — working notes for Claude Code

This folder is a finished Sprint Zero build that is now being refined by hand. It is a local-first screen recorder that runs in the browser: the browser captures and encodes the video, and a small local server stores and serves the files. Nothing leaves localhost.

The repo root `CLAUDE.md` describes how Sprint Zero generates builds at the repo root. This build was moved here afterwards, so wherever the root file says `server/`, `client/`, or `docs/`, read `examples/loom-clone/server/`, `examples/loom-clone/client/`, and `examples/loom-clone/docs/`.

## Do not re-run /sprint-zero for this build

`/sprint-zero` generates a product from scratch at the repo root. Its `--fresh` and `--rebuild` flags delete specs and code. Refinements go through the workflow below instead.

## Layout

- `docs/` — the spec set: `scope.md`, `prd.md`, `user-stories.md`, `api-contract.md`, `decisions.md`, `reference-brief.md`.
- `server/` — Express, SQLite (`data.db`), video files in `recordings/`. Both are gitignored and hold the user's real library.
- `client/` — React + Vite, plain JS. The recorder lives in `client/src/recorder/` and `client/src/components/`.
- Issues live outside this folder, in `.scratch/loom-clone/issues/` at the repo root (gitignored, local to this machine). Conventions are in the root `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`.

Configuration: project type `web-app`, stack `node-react`, data layer `local`, level `MVP`.

## Running it

```bash
cd examples/loom-clone/server && npm install && node seed.js && node index.js   # http://localhost:3001
cd examples/loom-clone/client && npm install && npm run dev                      # http://localhost:5173
```

Demo login: `dana.okafor@brightlane.io` / `walkthrough-2026`.

Before starting either server, check whether it is already running (`lsof -nP -iTCP:3001 -sTCP:LISTEN`, same for 5173). The frontend must be the only thing on port 5173: a second listener makes `localhost:5173` return the wrong app, and the backend only allows that one origin. Restart the backend after changing server code; the frontend hot-reloads.

`node seed.js` resets the demo account's recordings. Do not run it against the live `server/` once the user has made recordings they may want, without asking first.

## Refinement workflow

1. **Write each request as an issue** in `.scratch/loom-clone/issues/NN-<slug>.md`. If the request is ambiguous, set `Status: needs-info` and ask the user before anything else.
2. **Sort it.** A bug or polish item goes straight to code. A behaviour change or new feature changes the spec first.
3. **Spec first for behaviour changes.** Update `docs/user-stories.md` (new or changed story with acceptance criteria), `docs/api-contract.md` if the server is involved, and add a line to `docs/decisions.md`. Keep `docs/scope.md` and `docs/prd.md` consistent.
4. **Build in small batches** of related issues. Server changes that are a few lines can be made directly; larger work goes to the `backend-engineer` or `frontend-engineer` sub-agent with a brief that names this folder, the stories, and the rules below.
5. **Verify** with the checks in the next section, then give the user a click-through list for everything that needs a browser.
6. **Commit** only when the user asks, as small scoped commits: specs, server, client.

## Rules that are easy to break

- **The contract is law.** `docs/api-contract.md` is the shared interface. Change it before changing code that depends on it.
- **No browser automation.** Do not launch, open, or drive any browser (no Playwright, puppeteer, headless Chrome or Brave, no `open`), and say so in every sub-agent brief. An earlier agent's headless test launches coincided with the user's Brave crashing. The user tests by hand in Brave. Never use Chrome.
- **Do not kill processes you did not start.** If a server needs restarting and it is not yours, ask.
- **Nothing from outside localhost at runtime.** No CDN scripts, fonts, or models. The person-detection files are copied from `node_modules` into `client/public/mediapipe/` by `client/scripts/copy-mediapipe.mjs` on `predev` and `prebuild`.
- **Dim, hide, and view size are page-only.** They are done with DOM and CSS over the displayed camera view and must never touch the canvas or stream that feeds the recording.
- **The recorder tab is usually in the background while recording.** Anything drawn into the recording must be driven by the worker ticker (`client/src/recorder/tickWorker.js`), not `requestAnimationFrame`, and times must come from timestamps, not tick counts.
- **Use the exact labels in `docs/user-stories.md`.** The user tests against them.

## Verifying without a browser

Frontend: `cd client && npm run build` must succeed.

Backend: run the integration tests against a temporary copy of the server, so the user's library is not touched. The tests need a freshly seeded database and create throwaway accounts.

```bash
cd examples/loom-clone/server
T=$(mktemp -d /tmp/loomclone-apitest.XXXXXX)
rsync -a --exclude data.db --exclude 'data.db-*' --exclude recordings ./ "$T/"
cd "$T" && node seed.js >/dev/null
(PORT=3099 node index.js > server.log 2>&1 & echo $! > pid); sleep 2
API_URL=http://localhost:3099 node tests/integration.test.js | grep -c '^PASS'
kill $(cat pid); cd / && rm -rf "$T"
```

All checks should pass (120 as of refinement batch 1). When a contract value changes, check whether an existing test used it as its "invalid" example.

Everything about capture, the camera, segmentation, playback, and download can only be confirmed by the user in a browser. Report it as untested, never as passing.

## Known limits

- Recordings are WebM and the target browsers are desktop Brave, Chrome, and Edge.
- Camera-only video is 640x480, because the camera is opened at that size to keep blur and background replacement fast.
- A recording is held in browser memory until Stop, so very long recordings are a risk.
- If saving fails with an expired login, the take is lost.

## Current state

Refinement batch 1 (camera-only mode, mirror camera, show/dim/hide camera view) is built and committed but has not been confirmed in a browser. The click-through for it is in the three issue files under `.scratch/loom-clone/issues/`. Update this section when that changes.
