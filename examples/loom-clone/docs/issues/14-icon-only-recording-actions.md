# 14: Icons only for rename, download, and delete

Status: built
Batch: 6
Track: spec first
Area: client

## Request

> use only icons for rename, download, and delete

Clarified: where should the icons be used: grid cards only, grid and list, or everywhere, including the recording page?

> 1: C

## Behaviour

- Everywhere a recording's "Rename", "Download", and "Delete" buttons appear (each row of the "List" view, each card of the "Grid" view, and `/recordings/:id`), each is a button showing only an icon, with no word on it: a pencil for rename, a downward arrow for download, and a bin for delete. They keep their order: rename, download, delete.
- Resting the pointer on an icon shows its name: "Rename", "Download", or "Delete". Screen readers announce the same three names.
- Each icon does what its button did before. The rename icon shows the "Title" field with "Save" and "Cancel". The download icon downloads the recording. The delete icon asks "Delete this recording? This can't be undone."
- Only these three buttons change. "Save" and "Cancel" in the rename form, "Delete" and "Cancel" in the confirmation, "New recording", and every button on `/record` (including "Download instead") keep their words.
- The icons are part of the app itself: nothing is loaded from outside `localhost` to draw them.

## Spec changes

- User stories: story 14, "Rename a recording", story 15, "Download a recording", story 16, "Delete a recording", and story 29, "Grid view with thumbnails", changed where they say the user clicks "Rename", "Download", or "Delete": each becomes an icon with that name shown on hover.
- API contract: none (client only).
- Decisions: icons without words take less room, which the grid cards need, but are less obvious than words to someone new; the name on hover is the mitigation.

## Results

Batch 6, 2026-11-27.

**Built by:** frontend-engineer. Files changed: `client/src/components/RecordingActions.jsx`, `client/src/styles.css`, and a constraint appended to `docs/build-notes.md`.

**Checked by QA:** 126/126 existing tests passed against a temporary copy with a freshly seeded database, and the frontend build passed. QA read the code: one shared component draws the three buttons for the "List" rows, the "Grid" cards, and `/recordings/:id`; each holds only a drawing, with "Rename", "Download", or "Delete" as its hover text and screen-reader name; the other buttons keep their words; the drawings are part of the app and nothing is loaded from outside `localhost`. By request against the copy, rename, the empty-title error, the download header, and delete behave as before. Story 14, "Rename a recording": pass. Story 15, "Download a recording": pass. Story 16, "Delete a recording": pass. Story 29, "Grid view with thumbnails": pass. In all four, what happens on screen is untested.

**Untested:** that the three drawings read as a pencil, a downward arrow, and a bin; that the name appears on hover; what a screen reader says; that each icon works when clicked. The house rule against browser automation stopped every on-screen check.

**Click-through:**

- In the "List" view, each row should end with three icon-only buttons, in order: a pencil, a downward arrow, a bin, with no words on them. Check the same on a "Grid" card and on a recording's own page.
- Rest the pointer on each: you should see "Rename", "Download", "Delete".
- Click the pencil: the "Title" field appears with "Save" and "Cancel", both with words. Clear the field and click "Save": "Title can't be empty." Change the title and click "Save": the new title shows at once.
- Click the downward arrow: the recording downloads.
- Click the bin: "Delete this recording? This can't be undone." with "Delete" and "Cancel". Click "Cancel": the recording is still there.
- "New recording" on `/` and the buttons on `/record` still have their words.
