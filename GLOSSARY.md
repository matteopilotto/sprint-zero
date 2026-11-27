# Sprint Zero

Sprint Zero is a Claude Code kit that turns a reference URL and a few scoping answers into a spec set and a working product, then lets the user keep changing that product.

## Language

**Build**:
One generated product: its spec set and its code, living together in one folder.
_Avoid_: Project, app, example

**Baseline**:
The build as produced by the first full Sprint Zero run, before any refinement.
_Avoid_: Initial implementation, first version, v1

**Refinement**:
One requested change to a build that already has a baseline: a bug fix, a polish item, a changed behaviour, or a new feature. Changing the build configuration is not a refinement; it produces a new baseline.
_Avoid_: Adjustment, incremental change, tweak, polish (as a synonym)

**Batch**:
A group of refinements requested together, then built and verified together.
_Avoid_: Round, iteration, sprint

**Issue**:
The file that describes exactly one refinement, written for the user to review and for the build team to implement.
_Avoid_: Ticket, task, change request

**Track**:
The route a refinement takes to the code: straight to code for a bug fix or polish item, or spec first for a changed behaviour or new feature.
_Avoid_: Type, category, kind

**Built**:
The state of an issue whose code is in place and whose automated checks pass, but which the user has not yet tried.
_Avoid_: Done, complete, shipped

**Confirmed**:
The state of an issue the user has tried and accepted.
_Avoid_: Verified, tested, passing

**Build notes**:
Implementation constraints discovered while refining a build, kept for whoever implements the next batch.
_Avoid_: Working notes, gotchas, lessons

**House rule**:
A standing instruction from the user about how a build may be worked on, which overrides the build team's defaults.
_Avoid_: Preference, guideline, convention
