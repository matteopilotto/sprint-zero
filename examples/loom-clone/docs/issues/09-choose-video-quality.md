# 09: Better recording quality, with a choice of resolution

Status: built
Batch: 3
Track: spec first
Area: client

## Request

> Improve the overall quality of the recordings and add the option to choose the resolution/quality.

## Behaviour

- On `/record`, a "Video quality" control shows in every mode, offering "720p", "1080p", and "Original". "1080p" is selected the first time. The choice is remembered like the other settings.
- "720p" and "1080p" fit the picture inside 1280 by 720 or 1920 by 1080, keeping its shape and never enlarging it. "Original" keeps the size the browser captures, up to 4K (3840 by 2160).
- The data rate follows the picture size (about 2.5 Mbps at 720p, 5 Mbps at 1080p, up to 20 Mbps at 4K), and sound is recorded at 128 kbps.
- VP9 is used at "720p" and "1080p" when no camera background effect is running and the browser supports it. VP8 is kept with "Blur" / "Custom image" and at "Original", where VP9 would be too heavy for the machine. Files are still WebM.
- "Camera only" opens the camera at the chosen quality (1280 by 720, or 1920 by 1080 for "1080p" and "Original"), or the nearest size the camera has. With "Blur" or "Custom image" it stays at 1280 by 720 at most so the effect keeps up.
- "Screen + camera" still opens the camera at 640 by 480: the bubble is small, so a larger camera picture would not be visible.

## Spec changes

- User stories: new story 28, "Video quality". Story 22, "Camera-only recording", and story 21, "Remember settings", adjusted.
- API contract: none (client only). This is a browser-only setting.
- Decisions: reverses the "one quality level" part of the "One quality level, WebM format" cut and narrows the "VP8 video" decision. Recorded under "Refinement batch 3".

## Results

Batch 3, 2026-11-26.

**Built by:** not recorded. This issue was built with the hand-written workflow, before `/sprint-zero-refine` existed. Spec in commit ba8fb28, code in commit deca749. Files changed: `client/src/components/RecorderSetup.jsx`, `client/src/pages/RecordPage.jsx`, `client/src/recorder/compositor.js`, `client/src/recorder/draw.js`, `client/src/recorder/quality.js`, `client/src/recorder/settings.js`, `client/src/recorder/useCamera.js`, `client/src/recorder/useRecorder.js`, `client/src/styles.css`.

**Checked by QA:** no QA sub-agent ran. The original issue records that `npm run build` passes.

**Untested:** everything on screen. Nothing was checked in a browser. The points most likely to need adjusting are whether the browser honours the size limit passed to `getDisplayMedia` in "Screen only", and whether "Original" on a large screen records without stutter.

**Notes:** what was holding quality back before this issue:

- The recorder never told the browser how much data to spend, so the browser used its default of about 2.5 Mbps whatever the picture size. That is far too little for a full-size screen and is the main cause of blurry text and blocky motion.
- Video was encoded with VP8. VP9 looks clearly better at the same file size.
- "Camera only" was always 640 by 480.

**Click-through:**

- "Video quality" shows "720p", "1080p", "Original" in all three modes, with "1080p" selected the first time.
- Record the same screen in "Screen only" at each quality. Text should be sharper than before at "1080p", and the downloaded file's size in pixels should fit 1280x720, fit 1920x1080, and match the screen (up to 4K) respectively.
- Same in "Screen + camera": the bubble is still round, in the chosen corner, and moves smoothly.
- "Camera only" at "1080p" with background "None": the camera view restarts briefly when the quality changes, and the saved video is 1920x1080 (or the camera's largest size).
- "Camera only" with "Blur" and with "Mirror camera": the effect still keeps up, the blur looks as strong as before, and the saved video is 1280x720.
- Switching between "Screen + camera" and "Camera only" restarts the camera for a moment (new: it reopens at a different size).
- Record a minute or two at "Original" on the largest screen available and check playback is smooth, with no stutter. If it stutters, say so: the encoder may need a lower ceiling.
- Seeking and download still work on a new "1080p" recording (the file is now VP9).
- The chosen quality is still selected after reloading `/record`.
