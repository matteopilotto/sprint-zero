# 01: Option to mirror the camera

Status: confirmed
Batch: 1
Track: spec first
Area: client

## Request

> Add an option to mirror the camera.

Clarified: Does mirroring apply to the saved video as well as the preview? Mirrored video feels natural to the person recording, but any text they hold up reads backwards for viewers.

The user's answer, as the original issue recorded it (their exact words were not kept): mirroring applies to both the preview and the saved video.

## Behaviour

- On `/record`, a "Mirror camera" toggle shows in "Screen + camera" and "Camera only". It is off by default and hidden in "Screen only".
- With "Mirror camera" on, the camera picture is flipped left to right in the live preview and in the saved video, so the two always match.
- In "Screen + camera", the bubble is flipped and the screen is not.
- With the background set to "Custom image", the person is flipped and the image is not. With "Blur", the blurred room flips with the person.
- The choice is remembered with the other recorder settings: it is still on after reloading `/record`.

## Spec changes

- User stories: new story 23, "Mirror the camera".
- API contract: none (client only). This is a browser-only setting.
- Scope and PRD: `scope.md` gained a "Camera options" list with this option, and `prd.md` gained story 23 in its list. No sentence in either was false.
- Decisions: "Mirror camera" under "Refinement batch 1", since Loom's "flip camera" was not in the original scope. Text held up to the camera reads backwards for viewers.

## Results

Batch 1, 2026-11-26.

**Built by:** not recorded. This issue was built with the hand-written workflow, before `/sprint-zero-refine` existed. Spec in commit 09eec8d, code in commit 35b5d86; both commits also hold issues 02 and 03. Files changed in the code commit, for all three issues: `client/src/components/CameraView.jsx`, `client/src/components/RecorderSetup.jsx`, `client/src/components/RecordingStage.jsx`, `client/src/pages/RecordPage.jsx`, `client/src/recorder/draw.js`, `client/src/recorder/settings.js`, `client/src/recorder/useCamera.js`, `client/src/recorder/useRecorder.js`, `client/src/styles.css`.

**Checked by QA:** no QA run was recorded for this issue.

**Untested:** everything on screen. Nothing was checked in a browser before the click-through below was handed to the user.

**Click-through:**

- "Mirror camera" toggle shows in both camera modes, off by default, and is hidden in "Screen only".
- With it on, the preview and the saved video are both flipped.
- In "Screen + camera" the bubble is flipped and the screen is not.
- With "Custom image", the person is flipped and the image is not. With "Blur", the blurred room flips with the person.
- The setting is still on after reloading `/record`.

**Confirmed:** by the user, 2026-11-26. The original issue records: "User click-through: mirror works. Closed."
