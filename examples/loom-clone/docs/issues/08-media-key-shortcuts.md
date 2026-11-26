# 08: Media key shortcuts for pause and stop

Status: confirmed
Batch: 2
Track: spec first
Area: client

## Request

The user's exact words were not kept. The original issue recorded the request as:

> Floating controls cannot be used when the entire screen is shared (issue 07), so a whole-screen recording had no controls outside the recorder tab. The user asked to try the keyboard's media keys.

## Behaviour

- On `/record`, a "Media key shortcuts" toggle is visible and on by default, in every mode. With it off, the keys are untouched during a recording.
- While a take is under way, Play/Pause pauses and resumes, and Next track stops and saves. There is no key for cancel.
- The keys work from another tab or another app, including during a whole-screen recording.
- It works by playing a silent sound on a loop during the take, so the browser sends the media keys to the recorder page. The keys do not control a music player until the recording ends, and control it again afterwards.
- With "Computer audio" on, the silent sound adds no hum or clicks to the saved video.

## Spec changes

- User stories: new story 27, "Media key shortcuts".
- API contract: none (client only).
- Decisions: "Shortcuts use the keyboard's media keys, not letter keys" and "Media keys work by playing silence", under "Refinement batch 2".

## Results

Batch 2, 2026-11-26.

**Built by:** not recorded. This issue was built with the hand-written workflow, before `/sprint-zero-refine` existed. Spec in commit fda0074, which also holds issues 06 and 07. Code in commit b1aa1a4. Files changed: `client/src/components/RecorderSetup.jsx`, `client/src/components/RecordingStage.jsx`, `client/src/pages/RecordPage.jsx`, `client/src/recorder/mediaKeys.js`, `client/src/recorder/settings.js`.

**Checked by QA:** no QA run was recorded for this issue.

**Untested:** everything on screen. Nothing was checked in a browser, and the feature relies on browser behaviour that could not be confirmed for Brave before the user tried it.

**Click-through:**

- "Media key shortcuts" toggle is visible and on.
- Start a whole-screen recording, switch to another app: Play/Pause (F8 on a Mac keyboard) pauses; again resumes. Check on the recorder tab that the timer really stopped and restarted.
- Next track (F9) stops and saves; the recording appears in the library.
- If the keys do nothing: is something else (Spotify, Music, a YouTube tab) playing or recently played? Try with those closed, and report both results.
- If macOS opens the Music app when Play/Pause is pressed, the browser did not take the keys; report that.
- With "Computer audio" on, the saved video has no added hum or clicks.
- After the recording ends, the keys control the music player again.
- With the toggle off, the keys are untouched during a recording.

**Tried by the user:** 2026-11-26, in Brave. The original issue records: "User click-through: "yes, it works!". Closed."
