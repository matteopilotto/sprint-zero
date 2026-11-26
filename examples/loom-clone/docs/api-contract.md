# API contract

_Sprint Zero build. Stack: node-react. Data layer: local. Level: MVP._

## Auth

The backend exposes `POST /auth/signup`, `POST /auth/login`, and `GET /auth/me`. Signup and login return `{ access_token, user }`. The client stores the token and sends it as `Authorization: Bearer <token>` on protected calls; the backend verifies its own JWT, signed with `process.env.JWT_SECRET` (defaulting to a baked-in dev secret so nothing needs configuring).

Invalid or expired tokens return `401 Unauthorized`. Every entity is scoped to the authenticated user by `user_id`. List endpoints return only the current user's records. Ownership is checked on every read and write; a recording that belongs to another user is reported as `404`, exactly as if it did not exist.

Logging out is client-side only: the client discards the token. There is no logout endpoint.

**One exception to the header rule.** `GET /recordings/:id/file` also accepts the token as a `?token=<token>` query parameter, because a browser `<video>` element and a download link cannot send an `Authorization` header. No other endpoint accepts a token in the query string.

## Base URL

`http://localhost:3001`

The backend allows cross-origin requests from the frontend at `http://localhost:5173`.

## Entities

- `User` — a person with an account. Fields: `id`, `email`, `created_at`.
- `Recording` — one saved screen recording. Its details live in SQLite and its video lives as a file on disk in `server/recordings/`. Fields:
  - `id` — UUID v4 string.
  - `title` — string, 1 to 200 characters.
  - `mode` — `"screen"`, `"screen_camera"`, or `"camera"` (camera only, full frame).
  - `duration_seconds` — integer, the recorder's own elapsed time excluding pauses.
  - `size_bytes` — integer, size of the video file.
  - `mime_type` — string, for example `"video/webm"`.
  - `created_at`, `updated_at` — ISO 8601 strings.

The camera background, microphone setting, computer audio setting, video quality setting, floating controls setting, media key shortcuts setting, bubble position, mirror setting, and camera view (show, dim, hide, and its size) are recorder settings that live only in the browser. They are not stored and have no endpoints.

## Endpoints

### POST /auth/signup

**Purpose:** Create an account and sign in.
**Auth:** public
**Request body:**

```json
{ "email": "dana.okafor@brightlane.io", "password": "walkthrough-2026" }
```

**Response:** `201 Created`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "7c1f3b0e-2d4a-4e8b-9a51-6f0c2b7d9e13",
    "email": "dana.okafor@brightlane.io",
    "created_at": "2026-11-26T09:12:44Z"
  }
}
```

**Notes:** Email is trimmed and lower-cased before storing. Returns `400 invalid_input` if the email is missing or malformed or the password is shorter than 8 characters. Returns `409 email_taken` with message `"That email is already registered."` if the email already has an account.

### POST /auth/login

**Purpose:** Sign in to an existing account.
**Auth:** public
**Request body:**

```json
{ "email": "dana.okafor@brightlane.io", "password": "walkthrough-2026" }
```

**Response:** `200 OK` — same shape as `POST /auth/signup`.

**Notes:** Returns `401 invalid_credentials` with message `"Email or password is incorrect."` for an unknown email or a wrong password (the same response for both).

### GET /auth/me

**Purpose:** Return the signed-in user. The client calls this on load to confirm a stored token is still valid.
**Auth:** required
**Request body:** none
**Response:** `200 OK`

```json
{
  "user": {
    "id": "7c1f3b0e-2d4a-4e8b-9a51-6f0c2b7d9e13",
    "email": "dana.okafor@brightlane.io",
    "created_at": "2026-11-26T09:12:44Z"
  }
}
```

**Notes:** Returns `401 unauthorized` if the token is missing, invalid, or expired, or if the user no longer exists.

### GET /recordings

**Purpose:** List the current user's recordings for the library.
**Auth:** required
**Request body:** none
**Response:** `200 OK`

```json
{
  "recordings": [
    {
      "id": "b3e9a6c2-58d1-4f7e-8c0a-1d2e3f4a5b6c",
      "title": "Onboarding walkthrough v2",
      "mode": "screen_camera",
      "duration_seconds": 187,
      "size_bytes": 24811530,
      "mime_type": "video/webm",
      "created_at": "2026-11-26T10:41:07Z",
      "updated_at": "2026-11-26T10:52:30Z"
    },
    {
      "id": "0f4d7a91-3c2b-4e6d-b8a5-9e1c7f2d4a60",
      "title": "Recording — 25 Nov 2026, 16:08",
      "mode": "screen",
      "duration_seconds": 64,
      "size_bytes": 6120448,
      "mime_type": "video/webm",
      "created_at": "2026-11-25T16:08:19Z",
      "updated_at": "2026-11-25T16:08:19Z"
    }
  ]
}
```

**Notes:** Sorted by `created_at`, newest first. Returns `{ "recordings": [] }` when the user has none. No pagination at this level.

### GET /recordings/:id

**Purpose:** Get one recording's details for the recording page.
**Auth:** required
**Request body:** none
**Response:** `200 OK`

```json
{
  "recording": {
    "id": "b3e9a6c2-58d1-4f7e-8c0a-1d2e3f4a5b6c",
    "title": "Onboarding walkthrough v2",
    "mode": "screen_camera",
    "duration_seconds": 187,
    "size_bytes": 24811530,
    "mime_type": "video/webm",
    "created_at": "2026-11-26T10:41:07Z",
    "updated_at": "2026-11-26T10:52:30Z"
  }
}
```

**Notes:** Returns `404 not_found` with message `"Recording not found."` if the id does not exist or belongs to another user.

### POST /recordings

**Purpose:** Save a finished recording. Writes the video file to disk and creates its database entry.
**Auth:** required
**Request body:** `multipart/form-data` (the one endpoint whose request is not JSON), with these fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | file | yes | The recorded video. Sent with a filename such as `recording.webm` and a `video/webm` content type. |
| `mode` | text | yes | `screen`, `screen_camera`, or `camera`. |
| `duration_seconds` | text | yes | Whole number of seconds, `0` or more, from the recorder's timer. |
| `title` | text | no | 1 to 200 characters. If omitted or blank, the server sets `"Recording — <D MMM YYYY, HH:mm>"` using the server's local time. |

**Response:** `201 Created`

```json
{
  "recording": {
    "id": "5a8c2e17-9b3f-4d60-a7e4-c1f08b6d3e92",
    "title": "Recording — 26 Nov 2026, 14:32",
    "mode": "screen",
    "duration_seconds": 42,
    "size_bytes": 3984112,
    "mime_type": "video/webm",
    "created_at": "2026-11-26T14:32:51Z",
    "updated_at": "2026-11-26T14:32:51Z"
  }
}
```

**Notes:** The file is stored as `server/recordings/<id>.webm`; the folder is created on server start if missing and is gitignored. `size_bytes` is measured by the server. `mime_type` is the uploaded file's content type with any codec parameters removed (`video/webm;codecs=vp9,opus` is stored as `video/webm`). Maximum upload size is 2 GB. Returns `400 invalid_input` if `file` is missing or empty, `mode` is not one of the three values, or `duration_seconds` is not a whole number of 0 or more; in that case no file is left on disk. Returns `413 file_too_large` above the size limit.

### PUT /recordings/:id

**Purpose:** Rename a recording.
**Auth:** required
**Request body:**

```json
{ "title": "Bug report — invoice export times out" }
```

**Response:** `200 OK`

```json
{
  "recording": {
    "id": "5a8c2e17-9b3f-4d60-a7e4-c1f08b6d3e92",
    "title": "Bug report — invoice export times out",
    "mode": "screen",
    "duration_seconds": 42,
    "size_bytes": 3984112,
    "mime_type": "video/webm",
    "created_at": "2026-11-26T14:32:51Z",
    "updated_at": "2026-11-26T14:40:03Z"
  }
}
```

**Notes:** `title` is the only editable field; any other fields in the body are ignored. The title is trimmed. Returns `400 invalid_input` with message `"Title can't be empty."` if the trimmed title is empty, or a `400 invalid_input` if it is longer than 200 characters. Returns `404 not_found` if the id does not exist or belongs to another user. Updates `updated_at`.

### DELETE /recordings/:id

**Purpose:** Delete a recording, both its database entry and its video file.
**Auth:** required
**Request body:** none
**Response:** `204 No Content`
**Notes:** Returns `404 not_found` if the id does not exist or belongs to another user. If the video file is already missing from disk, the database entry is still removed and the response is still `204`.

### GET /recordings/:id/file

**Purpose:** Serve the video itself, for playback and for download.
**Auth:** required — either the `Authorization: Bearer <token>` header or a `?token=<token>` query parameter.
**Request body:** none
**Query parameters:**

| Parameter | Notes |
|-----------|-------|
| `token` | The access token, for use in `<video src>` and download links. |
| `download` | If `1`, the response adds a `Content-Disposition: attachment` header naming the file `<title>.webm` so the browser saves the file. Titles can contain non-ASCII characters (the default title has an em dash), so the header carries an ASCII fallback in `filename=` plus the real name in `filename*=UTF-8''...` (Express `res.attachment()` does this). |

**Response:** `200 OK` (or `206 Partial Content` for range requests) with the raw video bytes. `Content-Type` is the recording's `mime_type`. This is the one endpoint whose success response is not JSON.

**Notes:** Must support HTTP `Range` requests so the player can seek. For `download=1`, the filename is the recording's title with characters that are unsafe in filenames (`/ \ : * ? " < > |`) replaced by `-`, followed by `.webm`. Errors are JSON as usual: `401 unauthorized` for a missing or invalid token, `404 not_found` if the recording does not exist, belongs to another user, or its file is missing from disk.

Example URLs the client builds:

- Playback: `http://localhost:3001/recordings/5a8c2e17-9b3f-4d60-a7e4-c1f08b6d3e92/file?token=eyJhbGci...`
- Download: `http://localhost:3001/recordings/5a8c2e17-9b3f-4d60-a7e4-c1f08b6d3e92/file?token=eyJhbGci...&download=1`

## Error codes

| Status | `error` | When |
|--------|---------|------|
| 400 | `invalid_input` | A required field is missing or malformed. |
| 401 | `unauthorized` | Token missing, invalid, or expired. |
| 401 | `invalid_credentials` | Wrong email or password on login. |
| 404 | `not_found` | Recording does not exist or is not the caller's. Also any unknown route. |
| 409 | `email_taken` | Signup with an email that already has an account. |
| 413 | `file_too_large` | Upload exceeds 2 GB. |
| 500 | `server_error` | Anything unexpected. |

## Seed data

The seed script creates the schema and one demo user, `dana.okafor@brightlane.io` with password `walkthrough-2026`, and prints both to stdout. It also creates three demo recordings with realistic titles ("Onboarding walkthrough v2", "Bug report — invoice export times out", "Q4 roadmap review for design"), each backed by a small, valid, playable WebM file written to `server/recordings/`. The seed must not need the internet or any tool that is not an npm dependency; a tiny WebM committed as a fixture in `server/` and copied per recording is the expected approach. The seed is idempotent. It is run as `node seed.js` from `server/`. Each seeded recording's `duration_seconds` is the fixture's real length and its `size_bytes` is the real file size, so the library never disagrees with playback.

## Conventions

- All request and response bodies are JSON, with two documented exceptions: the `POST /recordings` request is `multipart/form-data`, and the `GET /recordings/:id/file` success response is video bytes.
- Timestamps are ISO 8601 strings in UTC with no milliseconds (e.g. `"2026-11-26T14:32:51Z"`).
- Access tokens expire after 7 days.
- IDs are UUID v4 strings.
- The backend never returns `user_id` or `password_hash` in response bodies, and never returns the file's path on disk.
- `POST` returns `201 Created` with the created resource.
- `PUT` returns `200 OK` with the updated resource.
- `DELETE` returns `204 No Content`.
- Error responses use shape: `{ "error": "short_code", "message": "Human readable." }`

## What agents must NOT do

- Do not add or remove endpoints without updating this file first.
- Do not change response shapes. The frontend and backend engineers build against this document in parallel — shape drift breaks the build.
- Do not skip JWT middleware on protected routes.
- Do not accept the `?token=` query parameter anywhere except `GET /recordings/:id/file`.
- Do not send recordings, or anything else, to any host other than `localhost`. No CDN scripts, no remote models, no analytics.
