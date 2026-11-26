# 03: Option to hide or dim the camera

Status: built
Batch: 1
Track: spec first
Area: client

## Request

> Add the option to hide the camera or apply a black overlay to make the camera less visible. This applies to "Screen + camera" and "Camera only".

Clarified: Where is the camera hidden or dimmed? Reading A: only in what the person recording sees on the recorder page, so they are not distracted by their own face, while the saved video still shows the camera normally. Reading B: in the saved video itself, so viewers see a hidden or darkened camera. Because the request covers "Camera only", where a saved video with no camera would be empty, reading A looked more likely.

The user's answer, as the original issue recorded it (their exact words were not kept): reading A. Hide and dim affect only what the person recording sees.

A second question, whether the overlay is one fixed darkness level or adjustable, was asked and not answered. The issue was built with one fixed level, and that choice is logged in `docs/decisions.md`.

## Behaviour

- Under the camera view, a "Camera view" control offers "Show", "Dim", and "Hide", in "Screen + camera" and in "Camera only".
- It can be changed before and during a recording.
- "Dim" darkens the camera view by one fixed amount.
- "Hide" replaces the camera view with a placeholder reading "Camera hidden", and "Camera hidden — still recording" during a recording. The camera indicator stays on. (Issue 04 later changed how this text is laid out.)
- With "Dim" or "Hide" selected, the saved video shows the camera at normal brightness. The control never changes the saved video.
- The choice is remembered: "Dim" is still selected after reloading `/record`.

## Spec changes

- User stories: new story 24, "Dim or hide my camera view".
- API contract: none (client only).
- Scope and PRD: `scope.md` gained a "Camera options" list with this option, and `prd.md` gained story 24 in its list. No sentence in either was false.
- Decisions: "Show, dim, or hide the camera view" and "The dim level is fixed", under "Refinement batch 1".

## Results

Batch 1, 2026-11-26.

**Built by:** not recorded. This issue was built with the hand-written workflow, before `/sprint-zero-refine` existed. Spec in commit 09eec8d, code in commit 35b5d86; both commits also hold issues 01 and 02. Files changed in the code commit, for all three issues: `client/src/components/CameraView.jsx`, `client/src/components/RecorderSetup.jsx`, `client/src/components/RecordingStage.jsx`, `client/src/pages/RecordPage.jsx`, `client/src/recorder/draw.js`, `client/src/recorder/settings.js`, `client/src/recorder/useCamera.js`, `client/src/recorder/useRecorder.js`, `client/src/styles.css`.

**Checked by QA:** no QA run was recorded for this issue.

**Untested:** everything on screen. Nothing was checked in a browser before the click-through below was handed to the user.

**Notes:** the "Camera only" half of this issue depended on issue 02, which was built in the same batch. Tried by the user on 2026-11-26, in part. The original issue records that hide works, but the "still recording" text is cut off in the round bubble (now issue 04). "Dim" was not mentioned, so this issue stays `built` until the user confirms it.

**Click-through:**

- "Camera view" offers "Show" / "Dim" / "Hide" in both camera modes, before and during a recording.
- "Hide" shows "Camera hidden", and "Camera hidden — still recording" during a recording; the camera indicator stays on.
- With "Dim" or "Hide", the saved video shows the camera at normal brightness.
- Least certain: a hidden view while the recorder tab is in the background. Record with "Hide" on, switch tabs, and check the saved video.
- The round placeholder text may look cramped in "Screen + camera".
- "Dim" is still selected after reloading `/record`.
