# 13: "View" choice as a drop-down list

Status: built
Batch: 6
Track: straight to code
Area: client

## Request

> make the view option a drop down list

## Behaviour

- On `/`, with at least one recording, the "View" control is a drop-down list labelled "View" in place of the two round buttons. Opening it offers "List" and "Grid", in that order.
- The drop-down shows the view currently in use: "List" the first time, otherwise the view last chosen in this browser.
- Choosing "Grid" or "List" in the drop-down switches the library straight away, with no extra button to press, and the choice is still remembered after a reload.
- With no recordings, the drop-down is not shown, as before.

## Spec changes

None.

## Results

Batch 6, 2026-11-27.

**Built by:** frontend-engineer. Files changed: `client/src/pages/LibraryPage.jsx`, `client/src/styles.css`.

**Checked by QA:** 126/126 existing tests passed against a temporary copy with a freshly seeded database, and the frontend build passed. For this issue QA read the code only: a "View" label and a drop-down list offering "List" then "Grid", no round buttons left, the view switched and saved in one step, and the control not drawn when there are no recordings.

**Untested:** all four Behaviour statements as seen on screen, because the house rule against browser automation stopped every on-screen check.

**Click-through:**

- Open `/` with at least one recording. You should see a drop-down list labelled "View" and no round buttons. Open it: "List" then "Grid".
- Choose "Grid": the library switches to cards at once. Reload: the drop-down still shows "Grid". Choose "List" and reload: it shows "List".
- With an account that has no recordings, you should see "No recordings yet." and no "View" drop-down.
