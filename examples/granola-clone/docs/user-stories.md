# User stories

_Level: MVP. Expanded from `docs/prd.md`._

Screens referenced below: `/signup`, `/login`, `/notes` (notes list), and `/notes/:id` (note editor). Visiting `/` redirects to `/notes` when signed in and to `/login` otherwise.

## Must-have

### Story 1 — Sign up

**Story:** As a new user, I want to sign up with email and password so that I can access the product.

**Acceptance criteria:**

- Given a visitor on `/signup`, when they fill the "Name", "Email" and "Password" fields with valid values (password at least 8 characters) and click "Sign up", then they are redirected to `/notes` and see the heading "Your notes".
- Given an email that is already registered, when they submit the signup form, then the message "An account with this email already exists" is shown and the URL stays `/signup`.
- Given a password shorter than 8 characters, when they submit, then the message "Password must be at least 8 characters" is shown.
- Given a visitor on `/signup`, when they click the "Log in" link, then they are taken to `/login`.

**Priority:** Must-have
**Effort:** Small

### Story 2 — Log in

**Story:** As a returning user, I want to log in so that I can see my own data.

**Acceptance criteria:**

- Given an existing account, when the user enters the correct email and password on `/login` and clicks "Log in", then they are redirected to `/notes` and see only notes they created.
- Given a wrong password, when they click "Log in", then the message "Invalid email or password" is shown and the URL stays `/login`.
- Given a visitor on `/login`, when they click the "Sign up" link, then they are taken to `/signup`.

**Priority:** Must-have
**Effort:** Small

### Story 3 — Session persists across reload

**Story:** As a signed-in user, I want my session to persist across reloads so that I don't have to log in every time.

**Acceptance criteria:**

- Given a signed-in user on `/notes`, when they reload the page, then they remain on `/notes` and still see "Your notes" and their name in the header.
- Given a signed-in user, when they open `/notes/:id` for one of their notes in a new tab, then the note loads without a login prompt.

**Priority:** Must-have
**Effort:** Small

### Story 4 — Log out

**Story:** As a signed-in user, I want to log out so that my session ends.

**Acceptance criteria:**

- Given a signed-in user, when they click "Log out" in the header, then they are redirected to `/login`.
- Given a logged-out user, when they visit `/notes` directly, then they are redirected to `/login`.
- Given no valid session token, when any `/api/notes` endpoint is called, then the API responds with HTTP 401 and an error body.

**Priority:** Must-have
**Effort:** Small

### Story 5 — Create a meeting note

**Story:** As a signed-in user, I want to create a new meeting note with a title so that I have a place to capture a meeting.

**Acceptance criteria:**

- Given a signed-in user on `/notes`, when they click "New note", then a new note is created and they are taken to `/notes/:id` with the title field empty and focused, and showing the placeholder "Meeting title".
- Given the editor, when they type a title and click "Save", then "Saved" appears and, after returning to `/notes`, the note appears at the top of the list with that title and today's date.
- Given a note saved with an empty title, then it is listed as "Untitled meeting".

**Priority:** Must-have
**Effort:** Small

### Story 6 — Type rough notes

**Story:** As a signed-in user, I want to type rough notes into the meeting note so that I can capture what matters to me during the call.

**Acceptance criteria:**

- Given an open note, when the user types into the "My notes" text area (placeholder "Write notes...") and clicks "Save", then "Saved" appears.
- Given they reload `/notes/:id`, then the "My notes" text area contains exactly the text they saved.

**Priority:** Must-have
**Effort:** Small

### Story 7 — Add a transcript

**Story:** As a signed-in user, I want to paste a transcript into the note or upload one as a text file so that the AI knows what was actually said.

**Acceptance criteria:**

- Given an open note, when the user pastes text into the "Transcript" text area (placeholder "Paste the meeting transcript...") and clicks "Save", then after reload the transcript text area contains the same text.
- Given an open note, when the user chooses a `.txt` file with the "Upload .txt" button, then the transcript text area is filled with the file's contents, and saving persists it.

**Priority:** Must-have
**Effort:** Small

### Story 8 — Enhance notes

**Story:** As a signed-in user, I want to click Enhance and get structured notes built from my rough notes and the transcript so that I end up with useful meeting notes without having to write them.

**Acceptance criteria:**

- Given a note whose "My notes" and "Transcript" are both empty, then the "Enhance" button is disabled.
- Given a note with rough notes or a transcript, when the user clicks "Enhance", then the button shows "Enhancing..." and, within 30 seconds, the "Enhanced" view is shown containing the headings "Summary", "Key points" and "Next steps".
- Given enhancement has finished, when the user reloads `/notes/:id`, then the enhanced notes are still present.
- Given enhancement has finished, then the "My notes" and "Transcript" contents are unchanged from before enhancement.
- Given enhancement has finished, then a small label shows the mode used: "Enhanced with AI" or "Enhanced locally".
- Given enhancement fails, then the message "Enhancement failed. Your notes are unchanged." is shown.

**Priority:** Must-have
**Effort:** Medium

### Story 9 — My notes / Enhanced toggle

**Story:** As a signed-in user, I want to switch between "My notes" and "Enhanced" so that I can see what I wrote and what was added.

**Acceptance criteria:**

- Given an enhanced note, when the user clicks the "My notes" tab, then the rough notes text area is visible, and when they click the "Enhanced" tab, then the enhanced notes are visible.
- Given a note that has never been enhanced, then the "Enhanced" tab is disabled.

**Priority:** Must-have
**Effort:** Small

### Story 10 — Notes list

**Story:** As a signed-in user, I want to see a list of my past meeting notes, newest first, and open any of them so that I can revisit what happened.

**Acceptance criteria:**

- Given a signed-in user with notes, when they open `/notes`, then each note is shown as a row with its title, date, and an "Enhanced" badge if it has enhanced notes, ordered by most recently updated first.
- Given two different accounts, when user A views `/notes`, then none of user B's notes appear. When user A requests user B's note by id, then the API responds with 404.
- Given a user with no notes, then the text "No notes yet. Click New note to start." is shown.
- When the user clicks a row, then they are taken to `/notes/:id` showing that note's saved title, rough notes, transcript and enhanced notes.

**Priority:** Must-have
**Effort:** Small

## Should-have

### Story 11 — Pick a template

**Story:** As a signed-in user, I want to pick a template before enhancing so that the output fits the kind of meeting.

**Acceptance criteria:**

- Given an open note, then a "Template" dropdown lists "General meeting", "1:1", "Customer discovery" and "Stand-up", with "General meeting" selected by default.
- Given "Customer discovery" is selected, when the user clicks "Enhance", then the enhanced notes contain the template-specific headings "Pain points" and "Quotes" in addition to "Summary" and "Next steps".
- Given they reload, then the dropdown shows the template saved with the note.

**Priority:** Should-have
**Effort:** Small

### Story 12 — Edit enhanced notes

**Story:** As a signed-in user, I want to edit the enhanced notes and save my changes so that I can fix mistakes.

**Acceptance criteria:**

- Given the "Enhanced" tab, when the user clicks "Edit", then the enhanced notes become an editable text area.
- When they change the text and click "Save", then after reload the "Enhanced" tab shows the edited text.

**Priority:** Should-have
**Effort:** Small

### Story 13 — Re-run Enhance

**Story:** As a signed-in user, I want to re-run Enhance after changing my notes or transcript so that the output stays up to date.

**Acceptance criteria:**

- Given an already-enhanced note, when the user clicks "Enhance", then a confirm dialog "Replace the current enhanced notes?" is shown. Accepting regenerates the notes, and cancelling leaves them unchanged.

**Priority:** Should-have
**Effort:** Small

### Story 14 — Delete a note

**Story:** As a signed-in user, I want to delete a meeting note so that my list stays tidy.

**Acceptance criteria:**

- Given an open note, when the user clicks "Delete" and accepts the confirm dialog, then they are redirected to `/notes` and the note is no longer listed.

**Priority:** Should-have
**Effort:** Small

## Nice-to-have

- Live transcription of computer audio instead of pasting transcripts.
- Ask-anything chat over one meeting or across all meetings.
- Quick actions: "Write follow-up email", "List actions", "Draft project plan".
- Share a note by link, readable without an account.
- Calendar sync and pre-meeting briefs.
- Search and folders for notes.
- Custom user-defined templates.

## Edge cases to discuss

- The user edits notes and navigates away without clicking "Save". At MVP we accept losing those changes. Should Enhance auto-save first? (Default: yes, Enhance saves the current fields before enhancing.)
- A very long transcript, such as two hours of text. The enhancer truncates its input to a fixed length and the stored transcript stays complete.
- A non-.txt file is uploaded. The file picker accepts `.txt` only.
- A user requests someone else's note id. The API returns 404 rather than 403, so it doesn't reveal that the note exists.
- An LLM key is set but the call fails. The API returns an error, the note stays unchanged, and the UI shows the failure message.

## Questions for the team

1. Should the LLM mode default to Claude when `ANTHROPIC_API_KEY` is set, or should local mode be forced during QA for determinism? (Default: QA runs without a key, so it uses local mode.)
2. Is plain text with simple markdown-style headings an acceptable format for enhanced notes at MVP, rather than rich text? (Default: yes.)
