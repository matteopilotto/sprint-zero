# 12: Grid view with thumbnails in the library

Status: confirmed
Batch: 5
Track: spec first
Area: client

## Request

> add a grid view with each recordings displayed using a rounded thumbnail and below the other information and options displayed in the list view (e.g., date, rename, download, delete buttons)

## Behaviour

- On `/`, when there is at least one recording, a "View" control with two choices, "List" and "Grid", shows above the recordings. "List" is selected the first time, and the list looks and works exactly as it does today.
- With "Grid" selected, the recordings are laid out as cards in columns, newest first, several to a line on a wide window and fewer as the window narrows.
- Each card shows a thumbnail on top: a still picture from the start of that recording, in a 16:9 box with rounded corners. A recording whose picture has a different shape is fitted inside the box without being stretched.
- Under the thumbnail, each card shows the same things as a list row: the title, the duration as mm:ss, the creation date, and the "Rename", "Download", and "Delete" buttons.
- Clicking a card's thumbnail or its title opens `/recordings/:id`, as clicking the title does in the list.
- "Rename", "Download", and "Delete" work in a card exactly as in the list: "Rename" shows the "Title" field with "Save" and "Cancel" inside the card, and "Delete" asks "Delete this recording? This can't be undone."
- If a recording's thumbnail cannot be loaded, the card shows a plain dark box in its place and everything else on the card still works.
- The chosen view is remembered in this browser: after a reload, or on the next visit, `/` opens in the view last selected.
- With no recordings, "No recordings yet." shows as before and the "View" control is not shown.

## Spec changes

- User stories: new story 29, "Grid view with thumbnails". Story 12, "Library", adjusted so its first criterion describes the "List" view. The "Nice-to-have" line "Thumbnails and search in the library." becomes search only.
- API contract: none (client only). The thumbnail is drawn by the browser from the video the existing `GET /recordings/:id/file` already serves.
- Decisions: reverses the thumbnails part of the "A flat library" cut. Thumbnails are read from the start of each video by the browser and are not stored as pictures, so nothing changes on the server and older recordings get one too; the costs are that the picture is whatever the recording opens on, and that the grid asks the server for the start of every video on the page. "List" stays the view shown first, and the chosen view is kept in the browser, not on the server.
- PRD: `prd.md` lists as out of scope "Folders, search, thumbnails, and archiving in the library." and as a nice-to-have "As a user, I want thumbnails and search in my library so that I can find a recording quickly." Both would be false for thumbnails; each gets a short note, as earlier batches did.

## Results

Batch 5, 2026-11-27.

**Built by:** frontend-engineer. Files changed: `client/src/pages/LibraryPage.jsx`, `client/src/components/RecordingThumbnail.jsx` (new), `client/src/styles.css`, and two constraints appended to `docs/build-notes.md`.

**Checked by QA:** 126/126 existing tests passed against a temporary copy with a freshly seeded database, and the frontend build passed. QA read the changed code against each Behaviour statement and found every on-screen label in the source, and confirmed by request against the copy that recordings come back newest first, that the video address answers ranged requests, and that a bad token or a missing file returns an error. Story 29, "Grid view with thumbnails": pass, with every on-screen criterion untested. Story 12, "Library": pass, with the look of the list under the new "View" control untested.

**Untested:** everything visual and interactive, because the house rule against browser automation stopped every on-screen check: the thumbnail actually showing a picture (for both MP4 and older WebM recordings), the rounded 16:9 box, unstretched fitting, the columns following the window width, clicks on the thumbnail and title, "Rename", "Download", and "Delete" inside a card, the dark box when a thumbnail cannot be loaded, and the view being remembered after a reload.

**Notes:** the thumbnail is the recording's own video, loaded just far enough to show a picture from 0.1 seconds in; no picture file is stored. Each card in "Grid" asks the server for the start of its video, so a very large library could be slow to fill in. The view is remembered in the browser under its own storage key, separate from the recorder settings.

**Click-through:**

- Open `/` signed in, with at least one recording. You should see a "View" control with "List" and "Grid" above the recordings, "List" selected, and the list looking exactly as before.
- Select "Grid". The recordings should become cards in columns, newest first, each with a still picture from the start of the recording on top, in a 16:9 box with rounded corners.
- Check a card for a recording made after batch 4 (MP4) and one made before (WebM): both should show a picture, not a dark box.
- If you have a "Camera only" or other recording that is not 16:9, its picture should sit inside the box with dark bars, not stretched.
- Under each thumbnail you should see the title, the duration as mm:ss, the creation date, and "Rename", "Download", and "Delete".
- Make the window narrower, then wider. There should be fewer cards to a line when narrow and several when wide.
- Click a card's thumbnail. You should land on `/recordings/:id` for that recording. Go back and click its title: same page.
- Click "Rename" on a card. The "Title" field with "Save" and "Cancel" should show inside that card without breaking the layout. Change the title and click "Save": the card shows the new title. Click "Rename" then "Cancel": nothing changes.
- Click "Download" on a card. The file should download as it does from the list.
- Click "Delete" on a card. You should be asked "Delete this recording? This can't be undone." "Cancel" keeps the card; "Delete" removes it. Use a recording you do not need.
- With "Grid" selected, reload the page. "Grid" should still be selected. Select "List" and reload: "List" should still be selected.
- Sign up with a new account and open `/`. You should see "No recordings yet." and no "View" control.
- Optional: a recording whose file is missing from `server/recordings/` should show a plain dark box with its buttons still working. Do not remove a file you want to keep to test this.

**Confirmed:** by the user, 2026-11-27.
