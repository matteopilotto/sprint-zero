# API contract

_Sprint Zero build. Stack: python-react. Data layer: local. Level: MVP._

## Auth

The backend exposes `POST /auth/signup`, `POST /auth/login` and `GET /auth/me`. Signup and login return `{ access_token, user }`. The `access_token` is a JWT (HS256) that the backend signs itself with `JWT_SECRET`, which defaults to `"sprint-zero-dev-secret"`, and it expires after 7 days. The client stores the token in `localStorage` and sends it as `Authorization: Bearer <token>` on every protected call. Logging out is client-side: the client deletes the stored token. There is no logout endpoint.

Invalid, missing or expired tokens return `401 Unauthorized`. Every note is scoped to the authenticated user by `user_id`. List endpoints return only the current user's records. Get, update, enhance and delete return `404` when the note does not exist or belongs to another user.

## Base URL

`http://localhost:8000` (FastAPI, python-react profile). The frontend runs on `http://localhost:5173`, and the backend allows that origin via CORS. The frontend reads the base URL from `VITE_API_URL`, defaulting to `http://localhost:8000`.

## Entities

- `User`: an account holder, with `id`, `email`, `name`, and `created_at`. The password hash is never returned.
- `Note`: one meeting note, holding the user's rough notes, the transcript, the selected template, and the enhanced output.
- `Template`: a fixed, read-only, built-in set that shapes the enhanced output. It is not stored per user.

### Note shape

```json
{
  "id": "3f6c2a9e-8b1d-4c7a-9e2f-5a1b0c7d4e21",
  "title": "Acme Corp discovery call",
  "rough_notes": "pricing pushback - too expensive for 20 seats\nwants SSO\nsend deck by Fri",
  "transcript": "Priya: Thanks for making time, Daniel...\nDaniel: Sure. Honestly the main thing is price...",
  "template": "customer_discovery",
  "enhanced_notes": "## Summary\nDaniel from Acme Corp is evaluating...\n\n## Pain points\n- ...\n\n## Quotes\n- ...\n\n## Next steps\n- Priya: send the deck by Friday",
  "enhanced_mode": "local",
  "enhanced_at": "2026-11-24T15:42:10Z",
  "created_at": "2026-11-24T15:00:03Z",
  "updated_at": "2026-11-24T15:42:10Z"
}
```

- `rough_notes`, `transcript`: plain text, defaulting to `""`.
- `template`: one of `general`, `one_on_one`, `customer_discovery`, `standup`. Defaults to `general`.
- `enhanced_notes`: a markdown-style plain-text string using `## ` headings and `- ` bullets, or `null` if the note has never been enhanced.
- `enhanced_mode`: `"ai"` (Claude) or `"local"` (rule-based), or `null` if the note has never been enhanced.
- `enhanced_at`: an ISO timestamp, or `null`.

### Note summary shape (used in lists)

```json
{
  "id": "3f6c2a9e-8b1d-4c7a-9e2f-5a1b0c7d4e21",
  "title": "Acme Corp discovery call",
  "template": "customer_discovery",
  "is_enhanced": true,
  "created_at": "2026-11-24T15:00:03Z",
  "updated_at": "2026-11-24T15:42:10Z"
}
```

## Endpoints

### POST /auth/signup

**Purpose:** create an account and sign the user in.
**Auth:** public
**Request body:**

```json
{ "name": "Priya Raman", "email": "priya@northwind.io", "password": "granola-demo-1" }
```

**Response (201):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "a1b2c3d4-0000-4e5f-8a9b-112233445566", "email": "priya@northwind.io", "name": "Priya Raman", "created_at": "2026-11-24T14:58:00Z" }
}
```

**Notes:** the email is lower-cased and trimmed. A missing email or a password under 8 characters returns `400 { "error": "invalid_input", "message": "Password must be at least 8 characters" }` (or a similar message for the email). An already-registered email returns `409 { "error": "email_taken", "message": "An account with this email already exists" }`. `name` is optional and defaults to the part of the email before the `@`.

### POST /auth/login

**Purpose:** sign in an existing user.
**Auth:** public
**Request body:**

```json
{ "email": "priya@northwind.io", "password": "granola-demo-1" }
```

**Response (200):** same shape as signup.
**Notes:** a wrong email or password returns `401 { "error": "invalid_credentials", "message": "Invalid email or password" }`.

### GET /auth/me

**Purpose:** return the current user. The frontend calls this on load to restore the session.
**Auth:** required
**Request body:** none
**Response (200):**

```json
{ "user": { "id": "a1b2c3d4-0000-4e5f-8a9b-112233445566", "email": "priya@northwind.io", "name": "Priya Raman", "created_at": "2026-11-24T14:58:00Z" } }
```

**Notes:** returns `401` if the token is missing or invalid.

### GET /api/templates

**Purpose:** list the built-in templates for the template dropdown.
**Auth:** required
**Request body:** none
**Response (200):**

```json
{
  "templates": [
    { "id": "general", "name": "General meeting", "sections": ["Summary", "Key points", "Next steps"] },
    { "id": "one_on_one", "name": "1:1", "sections": ["Summary", "Key points", "Feedback", "Next steps"] },
    { "id": "customer_discovery", "name": "Customer discovery", "sections": ["Summary", "Key points", "Pain points", "Quotes", "Next steps"] },
    { "id": "standup", "name": "Stand-up", "sections": ["Summary", "Key points", "Blockers", "Next steps"] }
  ]
}
```

**Notes:** the list is static. Every template includes "Summary", "Key points" and "Next steps", and the enhanced output uses exactly the listed sections, in order, as `## ` headings.

### GET /api/notes

**Purpose:** list the current user's notes, most recently updated first.
**Auth:** required
**Request body:** none
**Response (200):**

```json
{
  "notes": [
    { "id": "3f6c2a9e-8b1d-4c7a-9e2f-5a1b0c7d4e21", "title": "Acme Corp discovery call", "template": "customer_discovery", "is_enhanced": true, "created_at": "2026-11-24T15:00:03Z", "updated_at": "2026-11-24T15:42:10Z" },
    { "id": "7d2e9f10-4a3b-4c8d-b1e2-9f8a7b6c5d40", "title": "Weekly 1:1 with Sam Okafor", "template": "one_on_one", "is_enhanced": false, "created_at": "2026-11-21T10:00:00Z", "updated_at": "2026-11-21T10:31:45Z" }
  ]
}
```

**Notes:** returns `{ "notes": [] }` when the user has no notes.

### POST /api/notes

**Purpose:** create a meeting note.
**Auth:** required
**Request body:** all fields are optional.

```json
{ "title": "Acme Corp discovery call", "rough_notes": "", "transcript": "", "template": "general" }
```

**Response (201):** the full Note shape, with `enhanced_notes`, `enhanced_mode` and `enhanced_at` set to `null`.
**Notes:** if `title` is missing or blank after trimming, it is stored as `"Untitled meeting"`. An unknown `template` returns `400 { "error": "invalid_input", "message": "Unknown template" }`.

### GET /api/notes/{id}

**Purpose:** fetch one note in full.
**Auth:** required
**Request body:** none
**Response (200):** the full Note shape.
**Notes:** returns `404 { "error": "not_found", "message": "Note not found" }` if the note does not exist or is not owned by the caller.

### PUT /api/notes/{id}

**Purpose:** update a note. This is a partial update: only the fields sent are changed.
**Auth:** required
**Request body:** any subset of these fields.

```json
{
  "title": "Acme Corp discovery call",
  "rough_notes": "pricing pushback - too expensive for 20 seats\nwants SSO\nsend deck by Fri",
  "transcript": "Priya: Thanks for making time, Daniel...",
  "template": "customer_discovery",
  "enhanced_notes": "## Summary\nEdited by hand..."
}
```

**Response (200):** the updated full Note shape.
**Notes:** `updated_at` is bumped. A blank `title` is stored as `"Untitled meeting"`. Sending `enhanced_notes` saves manual edits but does not change `enhanced_mode` or `enhanced_at`. An unknown `template` returns `400`, and a note that doesn't exist or isn't owned by the caller returns `404`.

### POST /api/notes/{id}/enhance

**Purpose:** generate enhanced notes from the note's saved `rough_notes`, `transcript`, `title` and `template`.
**Auth:** required
**Request body:** none. The frontend saves the note with `PUT` first, then calls this endpoint.
**Response (200):** the updated full Note shape, with `enhanced_notes`, `enhanced_mode` and `enhanced_at` set.
**Notes:**

- If both `rough_notes` and `transcript` are blank, it returns `400 { "error": "nothing_to_enhance", "message": "Add rough notes or a transcript first" }`.
- If `ANTHROPIC_API_KEY` is set in the environment, the endpoint calls Claude (model from `ANTHROPIC_MODEL`, defaulting to `claude-sonnet-5-5`) and sets `enhanced_mode: "ai"`. Otherwise it runs the local rule-based enhancer and sets `enhanced_mode: "local"`. Both modes must produce exactly the template's sections as `## ` headings, in order, each followed by `- ` bullet lines, plus a paragraph under Summary.
- The local enhancer is deterministic. It builds the Summary from the title plus the first transcript sentences, Key points from the rough-notes lines (each expanded with the most relevant transcript sentence where possible), Next steps from lines containing action words ("send", "follow up", "will", "by", "todo", "action"), and template-specific sections from simple keyword heuristics. A section with no content gets a single bullet, `- None noted`.
- The transcript is truncated to its first 20,000 characters before being sent to the enhancer.
- `rough_notes` and `transcript` are never modified by this endpoint.
- If the Claude call fails, it returns `502 { "error": "enhance_failed", "message": "Enhancement failed. Your notes are unchanged." }` and the note is not modified.
- Re-running overwrites the previous `enhanced_notes`.

### DELETE /api/notes/{id}

**Purpose:** delete a note.
**Auth:** required
**Request body:** none
**Response:** `204 No Content`.
**Notes:** returns `404` if the note does not exist or is not owned by the caller.

## Conventions

- All request and response bodies are JSON.
- Timestamps are ISO 8601 UTC strings (e.g. `"2026-11-24T15:00:03Z"`).
- IDs are UUID v4 strings.
- The backend never returns `user_id` or `password_hash` in response bodies.
- `POST` returns `201 Created` with the created resource, except `POST /auth/login` and `POST /api/notes/{id}/enhance`, which return `200 OK`.
- `PUT` returns `200 OK` with the updated resource.
- `DELETE` returns `204 No Content`.
- Error responses use the shape `{ "error": "short_code", "message": "Human readable." }`, including `401 { "error": "unauthorized", "message": "Missing or invalid token" }`. The backend must convert FastAPI's default `{ "detail": ... }` errors, including request validation errors (respond `400 invalid_input`), into this shape.
- Health check: `GET /` returns `200 { "status": "ok" }` (public).

## What agents must NOT do

- Do not add or remove endpoints without updating this file first.
- Do not change response shapes. The frontend and backend engineers build against this document in parallel, and any drift in shape breaks the build.
- Do not skip JWT verification on protected routes.
