# 06: Record the audio the computer is playing

Status: built
Batch: 2
Track: spec first
Area: client

## Request

> Add the option to record the audio played.

## Behaviour

- On `/record`, a "Computer audio" toggle, off by default, shows in "Screen only" and "Screen + camera".
- When it is on, the browser's share prompt offers to share audio. If the user shares it, the saved video includes that sound, mixed with the microphone when the microphone is also on.
- If no audio was shared (the option was left unticked, or a single window was shared, which browsers cannot share audio for), recording carries on and a notice beginning "Computer audio isn't being recorded" says so.
- The toggle is not offered in "Camera only": browsers only hand over computer audio as part of a screen share, and that mode has no share prompt.
- The choice is remembered: the toggle is still on after reloading `/record`.

## Spec changes

- User stories: new story 25, "Computer audio".
- API contract: no endpoint, field, or error code. The sentence listing the recorder settings that live only in the browser gained the computer audio setting.
- Scope and PRD: `scope.md` gained a computer audio line. In `prd.md`, the out-of-scope line "Custom capture areas and system audio as a separate option." lost system audio.
- Decisions: reverses the "Computer sound is not offered" part of the earlier microphone decision. Recorded under "Refinement batch 2".

## Results

Batch 2, 2026-11-26.

**Built by:** not recorded. This issue was built with the hand-written workflow, before `/sprint-zero-refine` existed. Spec in commit fda0074, which also holds issues 07 and 08. Code in commit 3cde596, which also holds issue 07. Files changed in the code commit, for both issues: `client/src/components/FloatingControls.jsx`, `client/src/components/RecorderSetup.jsx`, `client/src/components/RecordingStage.jsx`, `client/src/pages/RecordPage.jsx`, `client/src/recorder/audioMix.js`, `client/src/recorder/settings.js`, `client/src/recorder/useFloatingWindow.js`, `client/src/recorder/useRecorder.js`.

**Checked by QA:** no QA run was recorded for this issue.

**Untested:** everything on screen. Nothing was checked in a browser.

**Click-through:**

- "Computer audio" toggle is visible and off in both screen modes, hidden in "Camera only".
- Turn it on, share a tab that is playing sound with the audio option ticked in the prompt: the saved video has that sound.
- Same with the microphone on: both the tab sound and your voice are in the video.
- Share the entire screen with audio ticked (needs a recent macOS and browser): system sound is in the video.
- Share a single window: the notice "Computer audio isn't being recorded…" shows and the recording still works.
- With speakers (not headphones) and the microphone on, check the played sound is not doubled or echoing.
- The toggle is still on after reloading `/record`.
