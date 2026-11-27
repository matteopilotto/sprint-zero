# 16: Rename the app from "Loom clone" to "Looky"

Status: built
Batch: 7
Track: spec first
Area: both

## Request

> rebrand the loom-clone as looky

Clarified: how should the name be written on screen, "Looky" or "looky"?

> 1. Looky

Clarified: how far should the rename go: on screen only (A), or on screen plus the build's own text, meaning the PRD title, the server's start-up message, the server README, the build's CLAUDE.md, the package names, and the code comments (B)?

> 2. B

## Behaviour

- The header on every signed-in page shows the wordmark "Looky" where it showed "Loom clone". Clicking it still opens `/`.
- The wordmark above the form on `/login` and `/signup` reads "Looky".
- The browser tab title is "Looky".
- While a recording is in progress, the name the system shows next to "Recording in progress" for the media keys is "Looky".
- "Loom clone" appears nowhere on screen.
- Starting the server prints "Looky API listening on http://localhost:3001".
- The server README is headed "Looky — server" and calls the product "Looky" throughout.
- The package names are `looky-server` and `looky-client`, in each `package.json` and its `package-lock.json`, and the server package's description says "Looky". Code comments that name the product say "Looky".
- The PRD is headed "Looky — PRD" and the build's `CLAUDE.md` is headed "Looky — notes for Claude Code".
- Someone who was signed in before the change is still signed in after it, and their saved recorder settings and their "List" or "Grid" choice are kept: the browser storage keys `loomclone_token`, `loomclone_recorder_settings`, and `loomclone_library_view` keep their names.
- The folder stays `examples/loom-clone`, and every path and run command that names it is unchanged.
- Mentions of Loom as the reference product stay as they are, in `docs/scope.md`, `docs/reference-brief.md`, `docs/decisions.md`, the PRD's "Reference: Loom" line and its comparisons with Loom, and the titles of earlier issues.
- Nothing else about the app changes: the same pages, labels, colours, and behaviour.

## Spec changes

- User stories: none. No story names the product, so every story is still true as written.
- API contract: none. What the API accepts and returns is unchanged.
- Decisions: none.
- PRD: the title line "# Loom clone — PRD" becomes "# Looky — PRD". Nothing else in the file changes.
- Build's `CLAUDE.md` (not part of the spec set, edited in the same step): the title line "# Loom clone — notes for Claude Code" becomes "# Looky — notes for Claude Code". The `examples/loom-clone` paths in it stay.

## Results

Batch 7, 2026-11-27.

**Built by:** backend-engineer and frontend-engineer. Files changed: `server/index.js`, `server/README.md`, `server/package.json`, `server/package-lock.json`, `client/index.html`, `client/src/components/Layout.jsx`, `client/src/auth/AuthForm.jsx`, `client/src/recorder/mediaKeys.js`, `client/package.json`, `client/package-lock.json`, and one constraint appended to `docs/build-notes.md`. The orchestrator changed the title lines of `docs/prd.md` and the build's `CLAUDE.md`.

**Checked by QA:** 126 of 126 existing tests passed against a temporary copy with a fresh seed, and the frontend build passed. A temporary copy of the server printed "Looky API listening on http://localhost:3099"; the built page has the tab title "Looky", the wordmarks and the media-keys name read "Looky" in the built bundle, and "Loom clone" is in no built file. The three storage keys, the folder paths, and the mentions of Loom as the reference product are unchanged. No story changed in this batch, so there was no story check.

**Untested:** everything on screen, because the house rule forbids driving a browser: that the header, the `/login` and `/signup` wordmarks, and the tab show "Looky"; that the header wordmark opens `/`; the name shown next to "Recording in progress" during a recording; that a signed-in person stays signed in with their recorder settings and "List" or "Grid" choice kept (only the unchanged key names were checked); that everything else looks and behaves as before; and the start-up line on port 3001 itself.

**Notes:** `server/node_modules/.package-lock.json` still carries the old package name; it is npm's own file and the next `npm install` in `server/` rewrites it. No client code comment named the product, so none changed.

**Click-through:**

- Without logging out first, reload http://localhost:5173 in Brave. You should still be signed in, and the header should show "Looky" where it showed "Loom clone".
- Look at the browser tab. Its title should be "Looky".
- Click the "Looky" wordmark in the header from any page. It should open `/`.
- Open the library. Your earlier "List" or "Grid" choice should still be selected.
- Open the recorder. Your earlier settings (for example "Video quality" and the camera background) should be as you left them.
- Start a recording and open the system's media controls (macOS Now Playing, or Brave's media control in the toolbar). You should see "Recording in progress" with "Looky" beside it.
- Log out. The wordmark above the form on `/login` should read "Looky"; go to `/signup` and it should read "Looky" there too.
- Look around the library, the recorder, and a recording's page. "Loom clone" should appear nowhere, and everything else should look and behave as before.
- Next time the backend is restarted, its terminal should print "Looky API listening on http://localhost:3001".
