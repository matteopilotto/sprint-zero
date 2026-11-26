# 05: Recording starts while the countdown still shows 1

Status: built
Batch: 2
Track: straight to code
Area: client

## Request

The user's exact words were not kept. The original issue recorded the report as:

> The recording starts slightly too early: it records while the countdown is still at 1. It should start exactly after the countdown has finished.

## Behaviour

- The first frame of a saved video shows the timer, never the countdown "1". Nothing from the countdown period is in the finished video (PRD story 8).
- The countdown still shows 3, 2, 1 one second apart.
- When the countdown ends, the page removes it and shows the timer at 00:00 before recording starts.
- The timer and the saved duration count from the moment the recorder really starts.

## Spec changes

None.

## Results

Batch 2, 2026-11-26.

**Built by:** not recorded. This issue was built with the hand-written workflow, before `/sprint-zero-refine` existed. Commit be30637. Files changed: `client/src/pages/RecordPage.jsx`, `client/src/recorder/useRecorder.js`.

**Checked by QA:** no QA run was recorded for this issue.

**Untested:** everything on screen. The cause is inferred from the code, not reproduced.

**Notes:** likely cause: the timing itself was right (the recorder started 3.0 seconds after the countdown began), but it started in the same instant the page was told to remove the countdown. The page needs a moment to repaint, and screen capture hands the recorder the most recent picture it has, which still showed the "1". So the first frame of the video was the countdown, which breaks PRD story 8: "nothing from the countdown period is included in the finished video". The fix: the recorder now starts a quarter of a second after the countdown leaves the screen, once the screen has caught up. The quarter-second delay is also recorded under "Refinement batch 2" in `docs/decisions.md`.

**Click-through:**

- Record the entire screen (or the recorder tab itself) with the recorder page visible. Play the video: the first frame shows the timer, never the countdown "1".
- The countdown still shows 3, 2, 1 one second apart, and the timer starts at 00:00.
- If the "1" still appears in the video, say so: the delay can be lengthened, or the cause is something else.
