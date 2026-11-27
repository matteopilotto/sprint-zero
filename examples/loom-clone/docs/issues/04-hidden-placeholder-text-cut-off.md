# 04: "still recording" text is cut off in the round bubble

Status: confirmed
Batch: 2
Track: straight to code
Area: client

## Request

The user's exact words were not kept. The original issue recorded the report as:

> With "Hide" selected in "Screen + camera", the placeholder text "Camera hidden — still recording" is cut off inside the round camera view during a recording.

## Behaviour

- In "Screen + camera" with "Hide" selected, during a recording, the round camera view reads "Camera hidden" with "still recording" on a second line, and nothing is clipped.
- Both lines sit well inside the circle.
- The same two lines show, unclipped, in "Camera only" at "Small", "Medium", and "Large".

## Spec changes

None.

## Results

Batch 2, 2026-11-26.

**Built by:** not recorded. This issue was built with the hand-written workflow, before `/sprint-zero-refine` existed. Commit 8373c10. Files changed: `client/src/components/CameraView.jsx`, `client/src/styles.css`.

**Checked by QA:** no QA run was recorded for this issue.

**Untested:** everything on screen. The cut-off could not be reproduced by reading the CSS alone, with no browser.

**Notes:** the fix puts "Camera hidden" and "still recording" on two short lines, with smaller text and a narrower text block in the round view. Because the cut-off was not reproduced, the text block was made small enough to fit with room to spare.

**Click-through:**

- "Screen + camera", "Hide", start a recording: the round view reads "Camera hidden" with "still recording" on a second line, nothing clipped.
- Same in "Camera only" at "Small", "Medium", and "Large".

**Confirmed:** by the user, 2026-11-27.
