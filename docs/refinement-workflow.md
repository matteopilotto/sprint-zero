# Refinement workflow — design

Status: designed on 2026-11-26, not yet built.

This document describes a planned addition to Sprint Zero: a way to keep changing a build after the first run has produced it. It records what was decided and why, so that whoever implements it does not have to reconstruct the reasoning. The terms in bold are defined in [`GLOSSARY.md`](../GLOSSARY.md).

## The gap

`/sprint-zero` takes a reference URL and produces a spec set and a working product in one pass. It has no way to change that product afterwards. Its only re-run options, `--fresh` and `--rebuild`, delete the specs or the code and start again.

Real builds need more than one pass. The loom clone in `examples/loom-clone/` was built by `/sprint-zero` and then changed nine times by hand: bug fixes, polish, and new features such as computer audio and a choice of video quality. That work followed a workflow written into the example's own `CLAUDE.md`, outside the kit. This design moves that workflow into the kit, so every build can be refined the same way.

## Summary

A new command, `/sprint-zero-refine`, takes one or more requests in plain words and applies them to a build that already exists. It writes each request down as a file the user can review, waits for approval, updates the spec set where behaviour changes, sends the code changes to the existing engineer sub-agents, checks the result, and reports what the user still needs to try by hand.

## Terms

The **baseline** is the build as the first full `/sprint-zero` run produced it. A **refinement** is one requested change to a build that has a baseline. An **issue** is the file that describes exactly one refinement. A **batch** is the group of refinements requested in one invocation of the command; they are built and checked together.

A prompt that lists three bugs and two features therefore produces five refinements, five issues, and one batch.

## What counts as a refinement

Four kinds of change are refinements: a bug fix, a polish item with no change in behaviour, a change to how an existing feature behaves, and a new feature.

Two kinds are not. Promoting the scope level (for example `MVP` to `Prod`) is deferred: it hardens the whole build instead of changing one thing, and needs its own design. Changing the build configuration (project type, stack profile, or data layer) is never a refinement; it produces a new baseline through `/sprint-zero`.

## The command

```
/sprint-zero-refine [build folder] <requests in plain words> [--no-confirm] [--no-launch]
```

The command works on the build at the repo root unless a build folder is given, for example `examples/loom-clone`. It recognises a build by the presence of `docs/scope.md` in that folder. Moving a build into `examples/` remains something the user does by hand.

It is a separate command, not a mode of `/sprint-zero`, because `/sprint-zero` carries destructive flags and a non-developer should not be one flag away from deleting a working build. `/sprint-zero` gains a guard: when a baseline already exists, it points the user to `/sprint-zero-refine` instead of resuming silently.

Running the command with no new request resumes any issues left at `approved` by an earlier batch that failed.

## The flow of one batch

1. **Check in.** List issues from earlier batches that are still `built` and ask whether any can be marked `confirmed`. This does not block; the user may ignore it. Then check git: if the build folder has uncommitted changes, say so, recommend committing first, and wait for the user's choice. If the folder is not in a git repository, warn once and continue.
2. **Split and clarify.** Break the prompt into individual refinements. If any are ambiguous, ask every clarifying question in one message before going further.
3. **Write the issues.** Create one file per refinement in the build's `docs/issues/`, with status `proposed`.
4. **Wait for approval.** Print a table of the issues (number, title, track, area, link) and wait. The user may reply in the chat or edit the files directly. On approval, re-read the files so manual edits count, and mark them `approved`. Issues the user rejects become `dropped`; the file is kept.
5. **Edit the spec set.** For issues on the spec-first track, update the spec files in place.
6. **Build.** Spawn the engineers whose side of the build is touched, in parallel when both are.
7. **Verify.** Spawn `qa-engineer` once for the batch.
8. **Report.** Mark passing issues `built`, print the batch summary, start or offer to restart the app, and suggest a commit.

Nothing in the spec set or the code changes before step 4 completes.

## The two tracks

Each refinement takes one of two **tracks**. A bug fix or polish item goes straight to code. A changed behaviour or a new feature goes spec first: the user stories change, the API contract changes if the server is involved, and any real tradeoff is added to the decisions file, all before any code is written.

The orchestrator chooses the track and says why. The user can overrule it at the approval step.

## Issue files

Issues live inside the build at `docs/issues/NN-<slug>.md` and are committed with the rest of the spec set. Numbers run continuously across batches and never restart. The reasons for keeping them inside the build are in [ADR 0001](adr/0001-refinement-issues-live-inside-the-build.md).

Each file has a short header and four sections.

| Part         | Content                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `Status`     | One of the six statuses below                                                                     |
| `Batch`      | The batch number                                                                                  |
| `Track`      | Straight to code, or spec first                                                                   |
| `Area`       | Server, client, or both                                                                           |
| Request      | The user's words, unchanged                                                                       |
| Behaviour    | What will be true afterwards, as statements that can be checked, using the exact on-screen labels |
| Spec changes | The stories, contract entries, and decisions that change; "none" on the straight-to-code track    |
| Results      | Filled in after the build: what QA checked, and what only the user can check                      |

An issue moves through these statuses.

| Status       | Meaning                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `needs-info` | The request is ambiguous and a question is waiting on the user             |
| `proposed`   | Written and waiting for the user's approval                                |
| `approved`   | The user agreed; work may start                                            |
| `built`      | The code is in and automated checks pass, but the user has not tried it    |
| `confirmed`  | The user has tried it and accepted it                                      |
| `dropped`    | The user decided against it                                                |

The difference between `built` and `confirmed` matters. Much of what a product does can only be judged by a person using it, and the loom clone showed that work easily sits built but untried for a long time.

## Approval

The command waits for approval by default. The user can skip the wait with `--no-confirm` or by saying so in the request ("go ahead without asking"). The table of issues is still printed, so the user can see what is being built. Clarifying questions for ambiguous requests are still asked, because a wrong guess costs more than a pause.

One approval covers both the spec changes and the code for an issue.

## Who does what

The main session is the orchestrator, as in the baseline run. It splits requests, writes issues, and edits the spec files in place, following the format each file already has. The writer commands (`/prd-generator`, `/user-story-writer`, `/api-contract-writer`, `/decisions-writer`) are not used, because each generates a whole file from scratch. `docs/scope.md` and `docs/prd.md` are edited only when a refinement would otherwise contradict them.

Code always goes to the worker sub-agents. The main session does not make code changes itself, however small; one rule is easier to explain than a judgement call. `tech-lead` is not invoked, because the approved issues serve as the build brief.

No new agents are added. `backend-engineer`, `frontend-engineer`, and `qa-engineer` each gain a short "Refinement mode" section with these instructions: read `docs/build-notes.md` and the approved issues first, change only what those issues require, do not restructure working code, record any constraint discovered along the way, and return a result for each issue instead of the single completion message used in the baseline run.

## Verification

`qa-engineer` runs once per batch. It runs the build's existing tests as a regression check and adds checks for each story the batch added or changed. The full auth dance is repeated only when the batch touches auth.

Anything QA cannot check is reported as untested and given to the user as a click-through list. It is never reported as passing.

## When part of a batch fails

If an engineer fails an issue or QA finds a regression, the orchestrator re-spawns the responsible engineer once with the failure report. If the problem remains, the run stops with the named state `REFINE_NEEDED`, in the same style as the failure states of `/sprint-zero`. Issues that passed are marked `built`. Failing issues stay `approved`, with the failure written in their Results section, so the next run can resume them.

## Protecting the user's data and running app

By the time a build is refined, its database may hold data the user cares about. Three rules follow.

- The command never runs the seed script against the live build.
- Schema changes are additive and are applied by the backend itself at startup, so existing data survives.
- QA tests against a temporary copy of the server with a freshly seeded database, never against the live one.

At the end of a batch the orchestrator checks the build's ports. If nothing is running, it starts the app and opens it, as `/sprint-zero` does, unless `--no-launch` was passed. If something is already listening, it does not stop it; it tells the user that backend changes need a restart and asks before restarting.

The command never commits. It recommends a commit before the batch if there are uncommitted changes, and suggests one when the batch ends.

## What carries over between batches

Each build gets one more file, `docs/build-notes.md`, created on its first refinement. It has two sections.

**House rules** are standing instructions from the user about how the build may be worked on, such as "do not drive a browser" or "test in Brave". The orchestrator adds one when the user states it, after confirming the wording. House rules override the agents' defaults: with "do not drive a browser" in place, QA skips browser checks and reports them as untested.

**Constraints** are implementation facts that engineers discovered and that no spec file holds, such as an ordering requirement imposed by a browser API. Engineers append them when they finish.

Every engineer and QA brief tells the sub-agent to read this file first. Without it, a fresh sub-agent in a later batch would know none of what earlier batches learned.

The record of what was asked and done is the set of issue files. `docs/decisions.md` holds only real decisions and tradeoffs, in one "Refinement batch N" section per batch. A batch of bug fixes may add nothing to it.

## The batch summary

The command ends by printing one row per issue (number, title, status, what QA checked), followed by the combined click-through list of everything only the user can confirm, and the suggested commit.

## What does not change

The presenter UI and `.sprint-zero/status.json` are left alone in this first version; the presenter shows the baseline run only, and the issue statuses act as the checkpoint for refinement. The writer commands, `tech-lead`, and `.claude/stacks.md` are unchanged.

## Order of work

1. Write `.claude/commands/sprint-zero-refine.md`, add the "Refinement mode" sections to the three worker agents, and add the guard to `/sprint-zero`.
2. Update the root `CLAUDE.md` (a "Refinement" section and the new runtime files) and `README.md` (a short "Changing your build afterwards" section).
3. As a separate step and first real test, migrate the loom clone: move its nine issues into `examples/loom-clone/docs/issues/` with the new statuses, move its rules into `docs/build-notes.md`, and reduce its `CLAUDE.md` to the path note and run commands.

## Open for later

- Promoting a build's scope level as a guided operation.
- Showing batches in the presenter UI.
