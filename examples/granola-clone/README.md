# granola-clone

A complete Sprint Zero run, committed as the pipeline produced it, plus one follow-up change (loading `server/.env`). Reference: [Granola](https://www.granola.ai/), with no repo. Scope: MVP, web-app, python-react, local. Run on 24 and 25 November 2026.

What it is: an AI notepad for meetings. A signed-in user creates a meeting note, types rough notes, pastes a transcript or uploads it as a .txt file, picks a template, and clicks Enhance. The result is a set of structured notes (Summary, Key points, template sections, Next steps), saved alongside the original. The user's own notes are never overwritten, and a "My notes / Enhanced" toggle switches between the two. The seed creates Priya Raman with four realistic notes.

## Run

```
cd server && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd server && .venv/bin/python seed.py && .venv/bin/uvicorn main:app --port 8000   # :8000
cd client && npm install && npm run dev                                         # :5173
```

Demo login: `priya@northwind.io` / `granola-demo-1`.

Enhance works with no configuration. With no key it uses a deterministic, rule-based enhancer, and the screen says "Enhanced locally". To have Claude write the notes, copy `server/.env.example` to `server/.env` and set `ANTHROPIC_API_KEY`. The server loads that file on startup, and the screen then says "Enhanced with AI". `ANTHROPIC_MODEL` is optional and defaults to `claude-sonnet-5-5`.

## What is here

- `docs/` holds the six generated specs: scope, reference brief, PRD, decisions, user stories, and API contract. The contract is the file both engineers built from. The decisions file also logs the tradeoffs the engineers made during the build.
- `server/` is a FastAPI app with stdlib SQLite, bcrypt and a self-issued HS256 JWT, and an idempotent seed. `enhancer.py` is the single module that switches between Claude and the local enhancer, and both return the same section format.
- `client/` is React on Vite, in plain JS and plain CSS, with a small hand-written renderer for the enhanced notes.
- `server/tests/` holds QA's tests. `integration.test.js` is the HTTP suite. `e2e.mjs` is a headless browser run of the auth dance and the core loop: start both servers, then run `PW_DIR=/path/with/playwright node server/tests/e2e.mjs`.

## What QA verified

The contract check passed on both sides, with no mismatches. Integration tests passed 47/47, covering every endpoint, every error shape, 404 for another user's note, and an expired token. In a real browser, the full auth dance (signup, reload, logout, protected redirect, login, API 401) and the core loop with the Customer discovery template both passed, and the headless script passed 19/19. After QA, AI mode was checked through the API: a real Claude enhance returned in about 3 seconds with the template's exact sections. An invalid key returned `502 enhance_failed` and left the note unchanged. No application code needed fixing.

Known gaps:

- Not tested in the browser: the .txt upload, and the "Enhancing..." label, which disappears too fast to catch in local mode.
- By design: no live audio, chat, sharing, search, or calendar features. See `docs/decisions.md`.
