# Refinement issues live inside the build, with the kit's own lifecycle

This repo has two places that hold issue files, on purpose. `.scratch/` is a gitignored, local tracker for work on the Sprint Zero kit itself, set up by one maintainer's personal skills. Refinement issues for a generated build live in that build's own `docs/issues/`, are committed with its spec set, and use the kit's own statuses (`needs-info`, `proposed`, `approved`, `built`, `confirmed`, `dropped`).

We chose this so that a cloned kit works with no extra setup, so that issues travel with a build when it is moved (for example into `examples/`), and because the audience is PMs and founders: the question they ask of an issue is "has it been built, and have I tried it?", not "who should pick this up?".

## Considered options

- Reusing `.scratch/<build>/issues/` and the triage labels. Rejected: not present in a fresh clone, not committed, and detached from the build it describes.
- No issue files, with the spec set and a log in `docs/decisions.md` as the only record. Rejected: the user wants each refinement written down for review before anything is built, and bug fixes change no spec file, so they would leave nothing to approve.
