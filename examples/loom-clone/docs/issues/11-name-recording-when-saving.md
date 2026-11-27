# 11: Name a recording when it is saved

Status: dropped
Batch: 4
Track: spec first
Area: client

## Request

> add the option to rename the recording

Clarified: the build already has "Rename" on every recording, in the library and on its own page. Which do you mean: A, name it when it is saved, typing a title after "Stop" before the recording goes to the library; B, the existing "Rename" is not working or is hard to find; or C, you had not spotted it?

> 2A

## Behaviour

- When a recording is stopped, the recorder page no longer saves it straight away. It shows a "Name your recording" step with a "Title" field, the hint "Leave it empty to use the date and time.", and a "Save" button.
- This step appears however the recording was stopped: "Stop" on the recorder page, "Stop" in the floating controls, the keyboard's Next track key, or the browser's own "Stop sharing" button.
- Typing a title and clicking "Save" (or pressing Enter in the field) shows "Saving recording…", then lands on `/` with the new recording first in the list under the typed title.
- Clicking "Save" with the "Title" field empty saves the recording under the automatic title, "Recording — " followed by the date and time, as today.
- The "Title" field accepts at most 200 characters.
- While the step is showing, the recording has not been saved yet. Closing or reloading the tab brings up the browser's leave warning, as it does during a recording.
- If the save fails, "Try again" saves with the same title that was typed.
- With "Media key shortcuts" on, the line shown during a recording reads "Media keys: Play/Pause pauses and resumes. Next track stops." because stopping no longer saves by itself.
- "Rename" in the library and on the recording page works as before, so a title given here can still be changed later.

## Spec changes

- User stories: story 11, "Stop and save", changed: its story sentence and its first three criteria now describe the "Name your recording" step between "Stop" and the save. Story 27, "Media key shortcuts", changed: the Next track key stops and brings up the same step, and the quoted line becomes "Media keys: Play/Pause pauses and resumes. Next track stops."
- API contract: none (client only). `POST /recordings` already accepts an optional `title` and sets the automatic one when it is left out.
- Decisions: a stopped recording now waits in the recorder tab until "Save" is clicked. A recording stopped from another tab or app, with the floating controls or the Next track key, stays unsaved and held in the browser's memory until the user comes back to the recorder tab.
- PRD: one sentence would become false. User story 11 in the PRD: "I want to stop and have the recording saved automatically so that it appears in my library without extra steps."

## Results

Not built yet.
