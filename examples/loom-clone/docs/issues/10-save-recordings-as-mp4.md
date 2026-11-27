# 10: Save new recordings as MP4

Status: confirmed
Batch: 4
Track: spec first
Area: both

## Request

> currently the recordings are saved as .webm files; add a more convenient format for uploading and sharing via google drive or youtube.

Clarified: I take "a more convenient format" to mean MP4. Where should it appear: A, a second button to download as MP4 while recordings stay WebM; B, a format choice on the recorder page; or C, MP4 only from now on, with no format choice anywhere and recordings already in the library staying WebM?

> 1C

## Behaviour

- A recording made after this change is saved as an MP4 file with H.264 video and AAC sound, the combination Google Drive, YouTube, and QuickTime all accept. This holds in "Screen only", "Screen + camera", and "Camera only".
- On "Your recordings" and on the recording page, "Download" on a new recording downloads a `.mp4` file whose name is based on the recording's title.
- A new recording plays on its recording page with sound, shows its full length, and can be seeked, as before.
- There is no format choice anywhere in the app. `/record` shows the same controls as before.
- Recordings made before this change are left as they are: they still play, and their "Download" still gives a `.webm` file.
- "Video quality" still decides the picture size exactly as story 28 says, and the camera background, "Mirror camera", and the bubble look the same in an MP4 recording as they did in WebM.
- If a save fails after "Stop", "Download instead" gives the take as a `.mp4` file.
- If the browser cannot make an MP4, the recording is still saved, as WebM, and is never lost.
- Nothing extra has to be installed on the machine to make the MP4, and nothing is sent outside `localhost`.

## Spec changes

- User stories: story 15, "Download a recording", changed: a new recording downloads as `.mp4` and plays in QuickTime as well as the browser, and an older one still downloads as `.webm`. The nice-to-have line "Download recordings as MP4." is removed.
- API contract: `Recording.mime_type` is `"video/mp4"` for new recordings and stays `"video/webm"` for older ones. `POST /recordings`: the `file` field is sent as `recording.mp4` with a `video/mp4` content type, and the file is stored as `server/recordings/<id>.mp4` (a WebM upload is still accepted and stored as `<id>.webm`). `GET /recordings/:id/file`: with `download=1` the filename ends in `.mp4` or `.webm` to match the recording's `mime_type`. The response examples for new recordings show `video/mp4`. No new endpoint, field, or error code. The seed data stays WebM.
- Decisions: reverses "WebM stays" in the "One quality level, WebM format" cut. Recordings already in the library are not converted and stay WebM. A browser that cannot make MP4 falls back to WebM instead of failing.
- PRD: two sentences would become false. In the risks: "the recording format (WebM) plays most reliably in Chrome-based browsers". In the open questions: "Not blocking: the build ships WebM."

## Results

Batch 4, 2026-11-27.

**Built by:** backend-engineer and frontend-engineer. Files changed: `server/lib/helpers.js`, `server/lib/upload.js`, `server/routes/recordings.js`, `server/tests/integration.test.js`, `server/README.md`, `client/src/recorder/toMp4.js` (new), `client/src/recorder/useRecorder.js`, `client/src/recorder/quality.js`, `client/src/api/client.js`, `client/src/components/RecordingStage.jsx`, and four constraints appended to `docs/build-notes.md`.

**Checked by QA:** 126 of 126 existing tests passed against a temporary copy with a freshly seeded database, and the frontend build passed. Story 15, "Download a recording": pass, at the API level: an MP4 upload is stored as `<id>.mp4`, served as `video/mp4` with seeking support, and downloads as `<title>.mp4`; a seeded WebM recording still downloads as `.webm`. The step that rewrites a take into an ordinary MP4 was run in Node on an ffmpeg-made H.264/AAC file and produced a valid MP4 with its length and index at the start. The rest of the Behaviour list was checked by reading the code only.

**Untested:** everything on screen and everything about capture, because the house rules forbid driving a browser. Specifically: that Brave's recorder really produces H.264 and AAC; sound in the saved file; the picture size per "Video quality"; the camera background, "Mirror camera", and the bubble in an MP4; playback, length, and seeking on the recording page; QuickTime, Google Drive, and YouTube accepting the file; "Download instead"; and the WebM fallback. None of the fallback paths has ever been run in a browser.

**Notes:** the browser's recorder is asked for MP4 (H.264 and AAC) first, and after "Stop" the take is rewritten in the browser into an ordinary MP4 without re-encoding, using `mediabunny`, which was already a dependency. If the browser will not record MP4, it records WebM as before and re-encodes it to MP4 after "Stop", which can take a long time on a long take while "Saving recording…" shows; only if that also fails is the take saved as WebM. No schema change and no new dependency. The rewrite briefly holds a second copy of the take in memory, so the existing risk with very long recordings is somewhat larger. One recording was saved at 11:32 on 2026-11-27, while the new client code was live and the backend was still running the old code: if it is an MP4 stored under a `.webm` ending it still plays and downloads, but its ending may not be what you expect.

**Click-through:**

- Restart the backend first; until then it runs the code from before this batch.
- On `/record`, choose "Screen only", click "Start recording", record about 10 seconds with some speech, and click "Stop". The recording should appear on "Your recordings".
- Open that recording. It should play with sound, show its full length, and jump correctly when you drag the seek bar.
- Click "Download" on the recording page, and again on "Your recordings". Each should save a file ending `.mp4` named after the recording's title.
- Open the downloaded `.mp4` in QuickTime. It should play the same video with sound, and the Movie Inspector should show H.264 and AAC.
- Repeat a short take in "Screen + camera" and in "Camera only". Each should save, play with sound, and download as `.mp4`.
- In "Screen + camera", turn on "Blur", then "Custom image", and "Mirror camera", and record. The bubble, the background, and the mirroring should look as they did before, and the recording should stay smooth.
- Record once at each "Video quality" setting: "720p", "1080p", and "Original". The downloaded file's picture size should match story 28. "Original" on a large screen is the most likely to fall back to WebM; note what ending you get.
- Look over `/record`, "Your recordings", and a recording page: there should be no format choice anywhere.
- Open a recording made before this change. It should still play, and "Download" should save a `.webm` file.
- To see "Download instead": start a take, stop the backend yourself before clicking "Stop", then click "Stop". When the save error appears, "Download instead" should save `recording.mp4`, and it should play. Start the backend again and click "Try again"; the take should save.
- Upload one downloaded `.mp4` to Google Drive or YouTube and confirm it is accepted and plays.

**Confirmed:** by the user, 2026-11-27.
