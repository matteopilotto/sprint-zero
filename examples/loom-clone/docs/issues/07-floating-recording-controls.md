# 07: Pause, stop, or cancel without going back to the recorder tab

Status: confirmed
Batch: 2
Track: spec first
Area: client

## Request

> To stop the recording I have to go back to the web app page and click "Stop". I want to pause, stop, or cancel from the current view, through shortcuts or floating buttons that are not part of the recording.

The request offered two ways, shortcuts or floating buttons. No question was put to the user: floating buttons were chosen when the issue was written. Ordinary keyboard shortcuts were not built, because a web page only receives key presses while it is the focused tab, so a shortcut could not work from another tab or app without a browser extension, which the scope excludes. Issue 08 later added media keys.

## Behaviour

- On `/record`, a "Floating controls" toggle is visible and on. With it off, no floating window opens.
- With it on, clicking "Start recording" opens a small always-on-top window: the browser's picture-in-picture window for web pages (Document Picture-in-Picture, in Chromium browsers). It shows the countdown, then the timer, with "Pause" / "Resume", "Stop", and "Cancel".
- The browser only lets a page open this window straight from a click. If the browser refuses to open it from the "Start recording" click, an "Open floating controls" button shows on the recorder page.
- From another tab, "Pause" stops the timer and shows "Paused", "Resume" continues, and "Stop" saves the recording and closes the floating window.
- "Cancel" asks "Discard this recording?" in the floating window. "Discard" throws the take away, and "Keep recording" carries on.
- Dismissing the share prompt closes the floating window.
- Closing the floating window with its own close button does not stop the recording. "Open floating controls" on the recorder page brings it back.
- The floating window is a real window on the screen. It is not in the saved video when a tab or a single window is shared.
- When the entire screen is shared, the floating window closes as soon as the share prompt closes, before recording starts, and the recorder page shows a notice beginning "Floating controls are closed because you are sharing your entire screen". The saved video has no floating window in it.
- All of this works the same in "Camera only".

## Spec changes

- User stories: new story 26, "Floating controls". It was changed again, in the same batch, for the entire-screen rule above.
- API contract: no endpoint, field, or error code. The sentence listing the recorder settings that live only in the browser gained the floating controls setting.
- Scope and PRD: `scope.md` gained a floating controls line. In `prd.md`, the out-of-scope line "Controls that float over other applications. A web page cannot draw outside its own tab." was replaced by one about letter-key shortcuts.
- Decisions: reverses the "Controls stay in the recorder tab" cut. Recorded under "Refinement batch 2", with the entire-screen rule, the "Open floating controls" fallback, and why letter-key shortcuts were not built.

## Results

Batch 2, 2026-11-26.

**Built by:** not recorded. This issue was built with the hand-written workflow, before `/sprint-zero-refine` existed. Spec in commit fda0074, which also holds issues 06 and 08. Code in commit 3cde596, which also holds issue 06 and includes the entire-screen fix described below. Files changed in the code commit, for both issues: `client/src/components/FloatingControls.jsx`, `client/src/components/RecorderSetup.jsx`, `client/src/components/RecordingStage.jsx`, `client/src/pages/RecordPage.jsx`, `client/src/recorder/audioMix.js`, `client/src/recorder/settings.js`, `client/src/recorder/useFloatingWindow.js`, `client/src/recorder/useRecorder.js`.

**Checked by QA:** no QA run was recorded for this issue.

**Untested:** everything on screen. Nothing was checked in a browser, and the original issue says this one has the most unknowns.

**Notes:** tried by the user on 2026-11-26, and not accepted. The original issue records that the floating buttons are in the recording, and they must not be. This was assumed to be an entire-screen share, the only case where a separate window can be captured; the user has not confirmed that assumption. The fix was built in the same batch: when the entire screen is shared, the floating window closes before recording starts and the recorder page says why. Story 26 and `docs/decisions.md` were updated with it. The user has not tried the fix, so this issue stays `built`. An open question from the original issue, how to control a whole-screen recording from elsewhere, led to issue 08.

**Click-through:**

First build:

- A "Floating controls" toggle is visible on `/record` and on. (If it is missing, Brave does not offer the picture-in-picture window and this feature needs a rethink.)
- Click "Start recording" and share a tab: a small floating window appears showing the countdown, then the timer. Does it open by itself, or only after clicking "Open floating controls" on the recorder page?
- Does the floating window get in the way of the browser's share prompt?
- From another tab: "Pause" stops the timer and shows "Paused"; "Resume" continues; "Stop" saves and the floating window closes.
- "Cancel" asks "Discard this recording?" in the floating window; "Discard" throws the take away, "Keep recording" carries on.
- Dismissing the share prompt closes the floating window.
- Closing the floating window with its own close button does not stop the recording; "Open floating controls" on the recorder page brings it back.
- Share a tab or a window: the floating window is not in the saved video. Share the entire screen: is it in the video?
- Same checks in "Camera only".
- With the toggle off, no floating window opens.

After the entire-screen fix:

- Share the entire screen: the floating window closes during the countdown, the notice "Floating controls are closed because you are sharing your entire screen…" shows, and the saved video has no floating window.
- Share a tab or a window: the floating window stays open and is not in the video.

**Confirmed:** by the user, 2026-11-27.
