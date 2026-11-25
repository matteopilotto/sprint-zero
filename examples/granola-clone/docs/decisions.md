# Decisions

_Sprint Zero build compared to Granola. Level: MVP._

## Why this document exists

We built a simplified web version of Granola, the AI notepad for meetings. It keeps the one loop that defines the product: write rough notes, add what was said, and get enhanced structured notes back without losing your own words. Granola is a native desktop and mobile app with live audio capture, calendar sync, chat, sharing and a large set of integrations. At MVP level our goal is to prove the core loop works end to end with real accounts and real saved data, so almost everything around that loop was cut or simplified. This document explains each cut, so stakeholders can see what the demo shows and what it leaves out.

## Scope decisions

### Pasted transcript instead of live audio capture

- **Reference does:** captures computer audio and transcribes the meeting live in the background, without a bot.
- **We chose to:** let the user paste a transcript or upload a .txt file.
- **Reason:** live capture needs a native app and a speech-to-text service. The core loop is about merging notes with what was said, and a pasted transcript proves that.

### AI enhancement with a zero-setup fallback

- **Reference does:** always enhances notes with a hosted LLM.
- **We chose to:** use Claude when an `ANTHROPIC_API_KEY` is set, and otherwise use a local rule-based enhancer that builds the same sections (summary, key points, next steps) from the notes and transcript.
- **Reason:** the build has to run straight after cloning with no keys. The output format and the saved data are identical in both modes, so the core loop is proven either way.

### Separate fields instead of inline grey AI text

- **Reference does:** shows the user's text in black and AI additions in grey, inside a single document.
- **We chose to:** store rough notes and enhanced notes as separate fields, with a "My notes / Enhanced" toggle.
- **Reason:** this delivers the same promise that your words are never lost, using simple text fields instead of a rich-text diff. That is the right trade at MVP.

### Fixed built-in templates only

- **Reference does:** has 29+ built-in templates, custom templates, and automatic template selection.
- **We chose to:** offer four built-in templates (General meeting, 1:1, Customer discovery, Stand-up), picked by hand.
- **Reason:** templates make the output feel tailored at low cost, but building custom templates is not part of the core loop.

### Speaker tagging

- **Reference does:** labels who said what in the transcript.
- **We chose not to:** the transcript is stored as plain text, exactly as pasted.
- **Reason:** most exported transcripts already include speaker names. Parsing them is not needed for the core loop.

### Calendar sync and pre-meeting briefs

- **Reference does:** detects upcoming meetings and prepares a brief before external calls.
- **We chose not to:** users create notes by hand.
- **Reason:** this needs Google or Microsoft calendar connections and runs before the core loop starts.

### Chat, Ask anything, and recipes

- **Reference does:** offers question-and-answer within one meeting or across all of them, plus saved reusable prompts.
- **We chose not to.**
- **Reason:** chat is a second AI feature on top of the core loop. MVP proves one AI loop well.

### Quick actions and follow-up emails

- **Reference does:** offers one-click "List actions", "Write follow-up email", and "Draft project plan".
- **We chose not to:** the enhanced notes include a "Next steps" section instead.
- **Reason:** "Next steps" covers the most common need inside the core loop. Separate actions are a v2 feature.

### Folders, sharing, and team workspaces

- **Reference does:** has shared folders, folder-level chat, link sharing without an account, and team workspaces.
- **We chose to:** keep a single private notes list per user.
- **Reason:** privacy per user is in scope. Collaboration is not part of the core loop.

### Notes search

- **Reference does:** searches across all notes.
- **We chose to:** show a notes list ordered newest first.
- **Reason:** a demo account has a handful of notes, and a sorted list is enough to find one.

### Integrations, MCP connector, and API

- **Reference does:** connects to Slack, Notion, HubSpot, Zapier, Attio, Affinity and Salesforce, exposes notes over MCP, and offers a public API.
- **We chose not to.**
- **Reason:** all of these sit downstream of the core loop and each needs external accounts.

### Mobile apps, voice typing, multi-language support

- **Reference does:** offers iOS, Android and Apple Watch apps, dictation in any app, and many languages.
- **We chose to:** build a single English web app.
- **Reason:** platform reach is not what the MVP is proving.

### Privacy, consent, retention, and enterprise controls

- **Reference does:** has consent messaging, transcript auto-deletion, model-training opt-out, SSO, SCIM, HIPAA and admin analytics.
- **We chose not to:** notes are strictly scoped to the signed-in user, and nothing else applies.
- **Reason:** these features matter for real deployment, which is beyond MVP. Per-user data isolation is kept because it is basic correctness.

### Paid tiers and the 30-day history limit

- **Reference does:** limits free users to 30 days of history and sells Business and Enterprise plans.
- **We chose not to:** every account gets everything, with no billing.
- **Reason:** monetisation is irrelevant to proving the core loop.

### Google sign-in

- **Reference does:** signs users in with Google OAuth.
- **We chose to:** use email and password, with no verification or reset.
- **Reason:** OAuth needs an external app registration. Email and password gives real accounts with zero setup.

## Technical decisions

### Stack: python-react with the local data layer

- **We chose:** a React (Vite) frontend in `client/`, a FastAPI backend in `server/`, and local SQLite storage with a JWT issued by the backend itself.
- **Reason:** the user picked the python-react profile, and the Python ecosystem suits LLM work. The local data layer means the demo runs with no account, no keys, and no `.env`. Sprint Zero ships from a small catalogue of profiles so the build stays predictable.

### Enhancer as a single swappable module

- **We chose:** one backend module that decides between Claude (if a key is set) and the local rule-based enhancer, and returns the same JSON shape either way. The API response says which mode was used.
- **Reason:** this keeps the frontend unaware of the mode, and lets QA run deterministically without a key.

### Project type: web-app

- **We chose:** a web app with a UI plus an API.
- **Reason:** the core loop is a writing-and-reading experience, and it needs a screen.

### Testing: Playwright via MCP

- **We chose:** Playwright driven by the QA sub-agent through the Playwright MCP, plus HTTP integration tests against the API.
- **Reason:** browser-driven tests catch the real user journey, including signup, login, logout and protected pages. MCP means the agent drives the browser without us wiring a test framework by hand.

### Build level: MVP

- **We chose:** MVP.
- **Reason:** the user wants to show that the idea actually works: real accounts, saved notes, and a working enhance loop, without investing in production polish.

## What we'd add next

1. **Live audio capture and transcription.** This removes the copy-paste step and is the biggest gap from the real product experience.
2. **Ask anything chat over a note, then across notes.** This reuses the stored transcripts and is the next most-loved Granola feature.
3. **Quick actions, starting with "Write follow-up email".** These are cheap to build on the existing enhancer and offer high everyday value.
4. **Share a note by link.** This turns private notes into something a team can use.
5. **Custom templates.** Users could tailor enhancement to their own meeting types.

## Frontend build notes

- **`/` redirects instead of showing a landing page.** `docs/user-stories.md` says `/` goes to `/notes` when signed in and to `/login` otherwise, so the frontend follows the stories and ships no marketing page.
- **Plain CSS instead of Tailwind.** One small `client/src/styles.css` keeps the calm Granola look with no build-time dependency.
- **Blank titles show as empty in the editor.** The backend stores a blank title as "Untitled meeting". The editor shows that value as an empty field with the "Meeting title" placeholder, so a new note opens with an empty title as Story 5 requires. A note deliberately named "Untitled meeting" also shows as empty, which is acceptable at MVP.
- **Forms use `noValidate`.** Browser validation would block submission before the backend's messages ("Password must be at least 8 characters") could be shown, so the backend validates and the UI shows its `message` as returned.
- **Session restore is lenient on network errors.** On load the client calls `GET /auth/me`. A 401 clears the token, but a network failure keeps the token so a backend restart doesn't log the user out.
- **Delete confirm copy.** The stories don't give the wording for the delete confirm dialog, so it reads "Delete this note?".

## Build log (backend)

- Passwords are hashed with the `bcrypt` package directly instead of `passlib`, because `passlib` is unmaintained and breaks with current `bcrypt` releases.
- If Claude returns headings that differ slightly from the template, the backend rewrites the output into the template's exact sections, in order, instead of failing. Only an actual API error or an empty reply returns `502 enhance_failed`.
- The local enhancer matches the contract's action words literally, so phrasings like "I'll finish the export" are not picked up as next steps. Keyword sections can repeat a point that appears in both the rough notes and the transcript.
- A token for a user who no longer exists is rejected with `401`. This can happen after the seed is re-run, because the seed re-creates the demo user with a new id, so signing in again is required.
- Seeded enhanced notes are generated by the local enhancer at seed time (`enhanced_mode: "local"`), so they match exactly what the app produces without a key.
- The backend loads an optional `server/.env` with `python-dotenv` at startup, so `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) can live in a file instead of the shell. `server/.env.example` lists the keys. With no `.env`, the app runs in local mode as before, so zero-setup still holds.
