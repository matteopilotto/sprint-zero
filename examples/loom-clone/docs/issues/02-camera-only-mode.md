# 02: Camera-only recording mode

Status: confirmed
Batch: 1
Track: spec first
Area: both

## Request

> Add the option to have camera only for the recording. In that case the camera recording is fullscreen, but the size of the window when recording can be adjusted.

Clarified: What does "the size of the window when recording can be adjusted" mean? Reading A: the on-page camera view shown while recording can be made smaller or larger, and the saved video is always the full camera frame. Reading B: the shape or size of the saved video itself can be chosen (for example wide, square, or tall).

The user's answer, as the original issue recorded it (their exact words were not kept): reading A. The on-page camera view can be resized while recording; the saved video is always the full camera frame.

## Behaviour

- On `/record`, a third mode, "Camera only", sits beside "Screen only" and "Screen + camera".
- In "Camera only" the page shows a rectangular camera view and no "Bubble position".
- "Start recording" shows no screen-share prompt, then the countdown.
- The saved video is the camera filling the whole frame, with no round bubble.
- The microphone toggle, "Mirror camera", and the camera background ("None", "Blur", "Custom image") work as in "Screen + camera", and the saved video matches the preview.
- Countdown, timer, pause, resume, stop, cancel, and save are unchanged.
- "Camera view size" offers "Small", "Medium", and "Large". It changes the view on the page, also during a recording and without interrupting it, and never changes the saved video.
- `POST /recordings` accepts `camera` as a third value of `mode`.

## Spec changes

- User stories: story 5, "Choose a recording mode", gains the third mode. New story 22, "Camera-only recording".
- API contract: `mode` gains a third value, `camera`. `POST /recordings` accepts it, and the `Recording` entity and the examples list it.
- Decisions: reverses the "Two recording modes instead of three" cut. Recorded under "Refinement batch 1", with the three steps of "Camera view size".
- Scope and PRD: `scope.md` gained "Camera only" in its recording modes list and the camera view size in "Camera options". In `prd.md`, the out-of-scope line "Camera-only recording, custom capture areas, and system audio as a separate option." lost camera-only recording, and story 22 joined the story list.

## Results

Batch 1, 2026-11-26.

**Built by:** not recorded. This issue was built with the hand-written workflow, before `/sprint-zero-refine` existed. Spec in commit 09eec8d, server in commit 202f11f, client in commit 35b5d86; the spec and client commits also hold issues 01 and 03. Files changed on the server: `server/routes/recordings.js`, `server/tests/integration.test.js`. Files changed in the client commit, for all three issues: `client/src/components/CameraView.jsx`, `client/src/components/RecorderSetup.jsx`, `client/src/components/RecordingStage.jsx`, `client/src/pages/RecordPage.jsx`, `client/src/recorder/draw.js`, `client/src/recorder/settings.js`, `client/src/recorder/useCamera.js`, `client/src/recorder/useRecorder.js`, `client/src/styles.css`.

**Checked by QA:** no QA sub-agent ran. The original issue records the backend as verified by the integration tests, 120 of 120 passing.

**Untested:** the whole client side. Nothing was checked in a browser before the click-through below was handed to the user.

**Notes:** camera-only removes the screen stream, so the recorder's start path, which until then called the screen picker first, needed a separate branch. Known at the time: camera-only video was 640x480. Issue 09 later changed that.

**Click-through:**

- "Camera only" shows a rectangular camera view and no "Bubble position".
- Start shows no screen picker, then the countdown; pause, resume, and stop work.
- The saved video is the full camera frame; camera and microphone indicators go off after stop.
- Repeat with "Mirror camera", "Blur", and "Custom image": the saved video matches the preview.
- Switch to another tab for ten seconds mid-recording: the video does not freeze.
- "Camera view size" "Small" / "Medium" / "Large" changes the page view mid-recording without interrupting it.
- "Cancel" discards the take and returns to setup.
- Regression: "Screen only" and "Screen + camera" recordings still work as before.

**Confirmed:** by the user, 2026-11-26. The original issue records: "User click-through: camera-only works. Closed."
