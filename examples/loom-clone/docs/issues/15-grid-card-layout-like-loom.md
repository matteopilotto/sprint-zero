# 15: Grid cards laid out like the Loom screenshot

Status: built
Batch: 6
Track: spec first
Area: client

## Request

> make the thumbnail and info below as the attached screenshot

The attached screenshot is one card from Loom's library. It has a thin border and rounded corners. The thumbnail fills the top of the card from edge to edge, with the length ("4 min") in a small dark badge in its bottom-right corner. Below it come a line with a round avatar, the owner's name, and the recording's age in grey ("3 years"), a "Share to Spaces" line, the title in bold, and a bottom line of view, comment, and reaction counts.

Clarified: how far should the card follow the screenshot: layout only, with the duration and date worded as now, or Loom's wording too ("4 min", "3 years")?

> 2: B

## Behaviour

- In the "Grid" view on `/`, each card has a thin border and rounded corners, and its thumbnail fills the top of the card from edge to edge with no padding around it. The thumbnail's top corners are rounded with the card; its bottom edge is straight.
- The thumbnail fills its 16:9 box completely. A recording with a different shape is cropped to fit, centred, in place of being shown with dark bars.
- The recording's length shows in a small dark badge with light text in the thumbnail's bottom-right corner, worded as in the screenshot: "45 sec" under a minute, "4 min" from one minute (whole minutes, rounded down), and "1 hr 5 min" from one hour.
- Under the thumbnail, in this order: the recording's age in grey, the title in bold, and on the bottom line the rename, download, and delete buttons, where the screenshot has its counts.
- The age is how long ago the recording was made, in the largest whole unit and without "ago": "just now" under a minute, then for example "5 minutes", "1 hour", "2 days", "3 weeks", "4 months", "3 years". Resting the pointer on it shows the full date as the list writes it, for example "26 Nov 2026, 14:32".
- A long title wraps onto further lines, as in the screenshot, and does not widen the card.
- Clicking the thumbnail or the title still opens `/recordings/:id`. A thumbnail that cannot be loaded still leaves a plain dark box, with the badge on it.
- The avatar, the owner's name, "Share to Spaces", and the view, comment, and reaction counts from the screenshot are not shown: the app has no sharing, comments, reactions, or view counts.
- The "List" view and `/recordings/:id` keep the duration as mm:ss and the full creation date.

## Spec changes

- User stories: story 29, "Grid view with thumbnails", changed: the thumbnail fills its box and is cropped; the duration is a badge on the thumbnail worded "4 min"; the date becomes the recording's age; the order under the thumbnail is age, title, buttons. Its known limits gain the cropping.
- API contract: none (client only).
- Decisions: reverses batch 5's choice to fit a thumbnail inside its box without cropping, so the edges of a recording that is not 16:9 are cut off in the thumbnail. The grid shows a rounded length and an age, so the exact duration and date are only in the "List" view and on the recording's page. The avatar, name, "Share to Spaces", and counts in the screenshot are left out because the scope excludes sharing, comments, reactions, and view analytics.

## Results

Batch 6, 2026-11-27.

**Built by:** frontend-engineer. Files changed: `client/src/pages/LibraryPage.jsx`, `client/src/components/RecordingThumbnail.jsx`, `client/src/format.js`, `client/src/styles.css`, and two constraints appended to `docs/build-notes.md`.

**Checked by QA:** 126/126 existing tests passed against a temporary copy with a freshly seeded database, and the frontend build passed. QA ran the length and age wording with 31 checks, all as the issue words them ("45 sec", "4 min", "1 hr 5 min"; "just now", "5 minutes", "2 days", "3 years", never with "ago"). The rest was read in the code and styles: the card's border and corners, the edge-to-edge thumbnail cropped to fill, the dark badge bottom-right (also over the dark box when a thumbnail fails), the order age, title, icons, the full date as the age's hover text, wrapping titles, both links to `/recordings/:id`, no owner, sharing, or counts, and the "List" view and recording page unchanged. Story 29, "Grid view with thumbnails": pass, with every visual criterion untested.

**Untested:** everything as actually drawn, and whether the card resembles the screenshot: a real frame in the thumbnail, the cropping of a recording that is not 16:9, the badge's position, wrapping, the hover date, and clicks. The house rule against browser automation stopped every on-screen check.

**Notes:** choices the engineer made that the issue does not settle: a recording of exactly one hour reads "1 hr"; a month counts as 30 days and a year as 365, so a recording 364 days old reads "12 months"; the age is worked out when the library is drawn and does not tick while the page stays open; a recording with no length reads "0 sec".

**Click-through:**

- Choose "Grid" in the "View" drop-down. Each card should have a thin border and rounded corners, with the thumbnail touching the left, top, and right edges, rounded at the top corners and straight along the bottom.
- A thumbnail should fill its box with no dark bars; a "Camera only" or odd-shaped recording should look cropped, not letterboxed.
- In the thumbnail's bottom-right corner, a small dark badge with light text should give the length: for example "5 sec" for a five-second take, "4 min" for one between four and five minutes.
- Under the thumbnail, top to bottom: the age in grey (for example "just now", "5 minutes", "1 hour", "2 days", with no "ago"), the title in bold, then the three icons. Rest the pointer on the age: the full date, like "26 Nov 2026, 14:32".
- Rename a recording to a very long title: it should wrap onto more lines and the card should stay the same width as its neighbours.
- Click a thumbnail, then go back and click a title: each opens that recording's page.
- There should be no avatar, owner name, "Share to Spaces", or counts on the card.
- Switch to "List" and open a recording's page: both still show the duration as mm:ss (like "00:05") and the full date.
