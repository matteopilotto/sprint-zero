# Build notes

What earlier batches learned about this build. Every engineer and QA sub-agent reads this file before working on a refinement.

## House rules

Standing instructions from the user about how this build may be worked on. They override the agents' defaults.

- No browser automation. Do not launch, open, or drive any browser: no Playwright, no puppeteer, no headless Chrome or Brave, no `open`. Say so in every sub-agent brief. Reason: an earlier agent's headless test launches coincided with the user's Brave crashing. (2026-11-26)
- The user tests by hand, in Brave. Never use Chrome. (2026-11-26)
- Do not stop processes you did not start. If a server needs restarting and it is not yours, ask. (2026-11-26)
- Use the exact labels in `docs/user-stories.md`. The user tests against them. (2026-11-26)

## Constraints

Facts about how this build works that no spec file holds, added by the engineers who found them.

- **Worker ticker for anything drawn into the recording.** The recorder tab is usually in the background while recording, where the browser slows `requestAnimationFrame` down. Anything drawn into the recording must be driven by the worker ticker, not `requestAnimationFrame`, and times must come from timestamps, not tick counts. File: `client/src/recorder/tickWorker.js`. [baseline]
- **Nothing is loaded from outside localhost at runtime.** No CDN scripts, fonts, or models. The person-detection files are copied from `node_modules` into `client/public/mediapipe/` on `predev` and `prebuild`. File: `client/scripts/copy-mediapipe.mjs`. [baseline]
- **Camera view controls are page-only.** "Dim", "Hide", and "Camera view size" are done with DOM and CSS over the displayed camera view. They must never touch the canvas or the stream that feeds the recording. File: `client/src/components/CameraView.jsx`. [02, 03]
- **Click order for the floating window.** `documentPictureInPicture.requestWindow()` only works straight from a user click and uses that click up. In `handleStart` it is called after `getDisplayMedia()` has been called and before anything is awaited. Keep that order. File: `client/src/pages/RecordPage.jsx`. [07]
- **The floating window closes for an entire-screen share.** A page cannot hide one of its own windows from a capture of the entire screen, so the window is closed before recording starts, using the `wholeScreen` value. Files: `client/src/recorder/useRecorder.js`, `client/src/recorder/useFloatingWindow.js`. [07]
- **Recording starts 250 ms after the countdown leaves the screen.** The recorder waits in a phase named `starting` so the screen has repainted before the first frame is captured. Starting in the same instant puts the countdown's "1" in the video. File: `client/src/recorder/useRecorder.js`. [05]
- **Media keys need a playing sound.** The browser only sends Play/Pause and Next track to a page that is playing something, so a silent looping sound holds the media session for the length of the take. File: `client/src/recorder/mediaKeys.js`. [08]
- **Camera size and data rate rules live in one file.** The camera opens at 640x480 in "Screen + camera" and follows "Video quality" in "Camera only" (1280x720 or 1920x1080), capped at 1280x720 while "Blur" or "Custom image" is on. The camera reopens when the size changes, which is only allowed in the setup phase. Video is VP9 at "720p" and "1080p" with no camera effect and VP8 otherwise, at a data rate set from the picture size. File: `client/src/recorder/quality.js`. [09]
- **A take is held in browser memory until "Stop".** Very long recordings are a risk. File: `client/src/recorder/useRecorder.js`. [baseline]
- **Integration tests use contract values as "invalid" examples.** When a contract value changes, check whether an existing test used it as its invalid example. The suite had 120 checks as of batch 1. File: `server/tests/integration.test.js`. [02]
- **Capture cannot be checked without a browser.** Everything about capture, the camera, person detection, playback, and download can only be confirmed by the user in a browser. Report it as untested, never as passing. [baseline]
