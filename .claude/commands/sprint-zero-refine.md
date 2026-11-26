# /sprint-zero-refine

You are the Sprint Zero orchestrator, working on a build that already has a baseline. Your job: take one or more requests in plain words, write each one down as an issue the user can review, wait for approval, send the code changes to the engineer sub-agents, have QA check the result without touching the user's data, and report what the user still needs to try by hand.

A build is one generated product, its spec set and its code together in one folder. The baseline is the build as the first full `/sprint-zero` run produced it. A refinement is one requested change to a build that has a baseline. A batch is the group of refinements requested together, then built and verified together. An issue is the file that describes exactly one refinement.

One invocation of this command is one batch. Each request in it is one refinement, and each refinement gets exactly one issue file.

## Arguments

`$ARGUMENTS` holds, in this order:

- An optional build folder, for example `examples/loom-clone`. When it is left out, the build is the repo root.
- The requests, in free text. The user may list several in one prompt.

To tell the two apart, look at the first word of `$ARGUMENTS`. If it is plainly written as a path (it contains `/` or starts with `.`), or it names a folder that holds `docs/scope.md`, treat it as the build folder and everything after it as the requests. Otherwise the build folder is the repo root and the whole text is the requests. An ordinary first word that happens to match a folder name, as in "client crashes on load", is part of the request.

`--no-confirm` (optional flag, anywhere in `$ARGUMENTS`): skip the wait in step 4. The issues are still written and the table is still printed, and the build starts straight after it. The flag is the user's approval given in advance. It does not skip clarifying questions: an ambiguous request is still asked about in step 2e, and that answer is still waited for. Take the flag out of the text before splitting the requests.

A plain instruction in the request has the same effect as `--no-confirm`: "go ahead without asking", "no need to confirm", "don't wait for me", "just build it". It counts only when it is about the run as a whole, not when it describes what the build should do ("delete the recording without asking" is a request about the delete button). It is not a refinement, so it gets no issue and is not quoted in one. If you cannot tell which is meant, wait for approval as usual.

`--no-launch` is an optional flag and may appear anywhere in `$ARGUMENTS`. It is not part of any request. With it, this command does not start, restart, or open the app at the end of the batch; it prints the run commands and the user starts the app themselves. See step 8e.

## Rules that hold for the whole run

These apply in every step. Later steps do not repeat them.

1. Before the user approves in step 4, no code changes, and no file in the spec set changes other than issue files and the build notes. The writes allowed before approval are these four and no others:
   - this batch's new issue files, and edits to them that the user asks for (steps 3 and 4b);
   - the build notes: creating the file, and adding a house rule whose wording the user has agreed (see "Build notes");
   - marking an earlier issue `confirmed` when the user says they tried it (step 1b);
   - updating an earlier `needs-info` issue whose question the user has now answered (step 3).
2. You never edit build code yourself, however small the change. Code goes to `backend-engineer` and `frontend-engineer`. You may read code to write a better issue.
3. Do not invoke `tech-lead`. The approved issues are the build brief.
4. You are the only one who writes issue files. Engineers and QA return results to you, and you record them.
5. The user's data is not test data. No step of this command runs the seed script in the build folder, and QA never tests against the build's own database.
6. Do not write `.sprint-zero/status.json`. That file belongs to the baseline run. The issue statuses are the checkpoint for a batch.
7. Say what you are doing before each step and each spawn. The user is watching.

## Where things live

Throughout this file, `<build>` means the build folder. Every path the worker agents know (`docs/`, `server/`, `client/`, `app/`, `cli/`) is relative to it.

- The spec set is `<build>/docs/`. The scope file is `<build>/docs/scope.md`.
- Issues are `<build>/docs/issues/NN-<slug>.md`. They are kept with the spec set and travel with the build if it is moved.
- The build notes are `<build>/docs/build-notes.md`: one file per build, kept with the spec set like the issues. See "Build notes" below.

Whether git tracks any of these depends on the repository's ignore rules. The git check before step 1 finds out and tells the user; do not assume the whole build is committed.

## Issue files

### Name and number

`NN` is a two-digit number. Numbers run continuously across batches and never restart: find the highest number among the files already in `<build>/docs/issues/`, whatever their status, and continue from the next one. The first issue of a build is `01`.

`<slug>` is three to six lowercase words joined by hyphens that name the change, for example `04-hidden-placeholder-text-cut-off.md`.

### Batch number

The batch number is one more than the highest `Batch:` value in the existing issue files, or `1` when there are none. Every issue written in this run carries the same batch number.

### Layout

Every issue file has a title, a four-line header, and four sections, in this order and with these headings.

```markdown
# NN: <short title in plain words>

Status: proposed
Batch: <batch number>
Track: <straight to code | spec first>
Area: <server | client | both>

## Request

> <the user's words for this refinement, unchanged>

## Behaviour

- <a statement that will be true afterwards and that someone can check>
- <another>

## Spec changes

<"None." on the straight-to-code track; the list described below on the spec-first track>

## Results

Not built yet.
```

**Request** quotes the user. Copy the part of the prompt that asks for this refinement exactly as typed, including typos. Do not tidy it, summarise it, or merge it with another request.

**Behaviour** says what will be true once the refinement is built, as a short list of statements a person or a test can check. Write on-screen text exactly as it appears in the app, in quotes: take labels from `<build>/docs/user-stories.md` and from the client code, not from memory. Say where to look and what to see ("With "Hide" selected, the round view reads "Camera hidden" on one line"), not how the code should change.

**Spec changes** lists what the refinement will change in the spec set, so the user can see its reach before agreeing. On the straight-to-code track it is always `None.` On the spec-first track it has one line per spec file, worked out in step 2d:

```markdown
## Spec changes

- User stories: <each story to add or change, by number and name, with a few words on what changes>
- API contract: <each endpoint, entity field, or error code to add or change, or "none (client only)">
- Decisions: <each tradeoff to record, in one line, or "none">
```

Add a line for `scope.md` or `prd.md` only when the refinement would contradict that file, and quote the sentence that would become false.

**Results** stays `Not built yet.` until step 8 fills it in.

**Area** says which side of the build the refinement touches. `server` is the part `backend-engineer` owns: the API, the data code, or the whole program for a `cli-tool`. `client` is the part `frontend-engineer` owns: the screens. `both` means each side needs a change.

**Track** is `straight to code` or `spec first`. Step 2d says how to choose. Every issue names its track, and the user may change it before approving.

### Statuses

An issue always has exactly one of these six statuses. They are the kit's own lifecycle; use no others.

| Status       | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `needs-info` | The request is ambiguous and a question is waiting on the user          |
| `proposed`   | Written and waiting for the user's approval                             |
| `approved`   | The user agreed; work may start                                         |
| `built`      | The code is in and automated checks pass, but the user has not tried it |
| `confirmed`  | The user has tried it and accepted it                                   |
| `dropped`    | The user decided against it                                             |

## When a batch cannot finish

An engineer may fail an issue, and QA may find that an issue does not do what it says or that the batch broke an existing test. Each such failure gets one automatic retry: the responsible engineer is re-spawned once with the failure report. Step 6d covers an engineer's failure and step 7 covers QA's. No issue is retried more than once in a run.

If the problem is still there after the retry, the run does not go on trying. It finishes the report in step 8 and ends in one named state:

```
STATE: REFINE_NEEDED — issue(s) <NN, NN> failed again after one retry and are still `approved`. Read the Results section of each to see what failed, then run /sprint-zero-refine <build> with no request to try them again. To change what an issue asks for, edit its file first. To give one up, set its Status line to `dropped` first.
```

Step 8f prints it, with the real issue numbers and build folder filled in. 8f is the last sub-step of the run and comes after the batch summary, the suggested commit, and the app step (8c to 8e). Those steps still run: issues that passed are worth committing and trying. No branch of 8e ends the run before the state is printed.

What a run that ends this way leaves behind:

- Issues that passed are `built`, exactly as in a clean run. Good work is not held back by a failure elsewhere in the batch.
- Failing issues are `approved`, and the Results section of each records what failed, in the engineer's or QA's own words.
- Running the command again with no request picks the `approved` issues up without asking for approval a second time (step 2a).

Never mark a failing issue `built` to close a batch, and never set one to `dropped` unless the user tells you to. Only the user drops an issue.

## Build notes

The build notes file is `<build>/docs/build-notes.md`. It carries what one batch learned to the next: a sub-agent spawned in a later batch starts with no memory, and this file is how it finds out what the user has ruled and what earlier engineers discovered.

### Layout

The file has a title, one line of introduction, and two sections, with exactly these headings.

```markdown
# Build notes

What earlier batches learned about this build. Every engineer and QA sub-agent reads this file before working on a refinement.

## House rules

Standing instructions from the user about how this build may be worked on. They override the agents' defaults.

None yet.

## Constraints

Facts about how this build works that no spec file holds, added by the engineers who found them.

None yet.
```

Step 3 creates the file from this template on the build's first refinement. After that it is only ever added to. When the first entry goes into a section, it replaces that section's `None yet.` line.

### House rules

A house rule is a standing instruction from the user about how the build may be worked on, for example "do not drive a browser" or "do not stop processes you did not start". It is about how the work is done, not about what the product does: a request to change the product is a refinement and gets an issue.

The user may state a house rule anywhere: in the prompt next to the requests, in a reply while you wait for approval, or later in the run. Whenever you notice one:

1. Decide whether it is standing or one-off. A standing rule is one the user would expect to hold in every later batch without saying it again. A one-off instruction applies to this batch only ("skip the restart this time", "leave the server alone today"). If you cannot tell, ask: "Should this hold for every future batch, or only this one?"
2. Follow a one-off instruction for the rest of this batch and repeat it in every brief you write, but do not write it to the build notes.
3. For a standing rule, put the wording you intend to record in front of the user and wait for a yes or a correction:

   > I will record this as a house rule for this build, so every later batch follows it:
   >
   > "<the rule as one or two plain sentences>"
   >
   > Is that wording right?

   For a rule stated in the prompt, ask this at the end of step 2, before writing the issues, in the same message as the questions of step 2e when there are any, so the user is interrupted once. For one stated later, ask as soon as you notice it. `--no-confirm` does not skip this question: it approves the batch in advance, not the wording of a rule.
4. Once the user agrees, add the rule as one list item under `## House rules`, in the agreed wording, with the date. Add a short reason only if the user gave one. Never write a house rule the user has not agreed the wording of, and never record one on your own initiative.

Agreeing the wording of a house rule is not approval of the batch. Step 4 still waits for that.

A rule the user has stated is in force for the rest of the run from the moment they state it, even while its wording is still being agreed. House rules bind you as well as the sub-agents, and they override the defaults in this file and in the agents' instructions. If a house rule makes a step of this command impossible, skip that part of the step and say so in the batch summary; do not bend the rule.

If the user withdraws or changes a house rule, confirm the new wording the same way and edit that one entry.

If the prompt holds a house rule and no request, that is a complete run: agree the wording, create the build notes file if it is missing, write the rule, and stop. No issue is written and no batch is started.

### Constraints

A constraint is a fact about how this build works that an engineer discovered while working on it and that no spec file holds, for example an order of calls a browser API insists on. Engineers in refinement mode append constraints under `## Constraints` when they finish. This is the one write engineers make inside `<build>/docs/`; rule 4 still holds, and they do not touch the issue files or the house rules.

You do not write constraints yourself. If an engineer's result says an existing constraint is no longer true, correct or remove that one entry and mention it in the batch summary.

---

## Before step 1 — find the build

Check that `<build>/docs/scope.md` exists. A folder is a build only when it holds that file.

If the folder does not exist, or it has no `docs/scope.md`, print this and stop. Write nothing: no issue file, no `docs/` folder, no `issues/` folder.

> `<build>` does not hold a Sprint Zero build: there is no `docs/scope.md` in it. Nothing was written.
>
> Point this command at a folder that has a baseline, for example `/sprint-zero-refine examples/loom-clone <your requests>`, or run `/sprint-zero <url>` first to create one.

If the build is found, read `<build>/docs/scope.md` and resolve its build configuration (project type, stack profile, data layer) and scope level against `.claude/stacks.md`. Keep the resolved directories, run commands, and ports for steps 6 and 7. Then print:

> Refining the build in `<build>` (<project type> / <stack profile> / <data layer>, <scope level>).

If `<build>/docs/build-notes.md` exists, read it now. Its house rules apply to you for the whole run, as "Build notes" above describes.

---

## Before step 1 — check git

A refinement changes code the user may not have saved yet. Check for a restore point now, before this command writes anything, so that every uncommitted change you find is the user's own and not this batch's.

This command never commits, stages, stashes, branches, or makes any other git write, at any point in the run, even if the user asks. If the user asks you to commit, give them the commands to run themselves.

Run `git -C <build> rev-parse --is-inside-work-tree`.

**If it fails**, the build is not in a git repository (or git is not installed). Print this once, carry on, and do not mention git again in this run, including in step 8d:

> `<build>` is not in a git repository, so there will be no restore point if a change goes wrong. Carrying on.

**If it succeeds**, first find out which parts of the build git does not track. Run `git -C <build> check-ignore` with these paths as arguments: each of the build's resolved code directories, and the six spec files `docs/scope.md`, `docs/reference-brief.md`, `docs/prd.md`, `docs/decisions.md`, `docs/user-stories.md`, and `docs/api-contract.md`. It prints every path that is ignored and changes nothing. The kit's own `.gitignore` ignores the code and those six files for a build at the repo root, so there git may see only the issue files and the build notes. Never edit `.gitignore`.

If it prints any path, keep the list for step 8d and tell the user plainly, once:

> Git ignores these parts of the build: <the ignored paths>. They are not tracked, so a commit is not a restore point for them. If you want one, copy the build folder to somewhere outside it before you approve the batch, for example `cp -R <build> <a folder of your choice>`.

Do not wait for a reply to this, and do not make the copy yourself. If nothing is ignored, say nothing about it.

Then run `git -C <build> status --porcelain -- .` to list the uncommitted changes inside the build folder. Ignored files do not appear and do not count.

If the list is empty, go on to step 1.

If it is not empty, print the changed files (the first ten, then "and <count> more" if the list is longer), followed by:

> The build in `<build>` has uncommitted changes. I recommend committing them first, so you have a restore point if this batch goes wrong. I will not commit for you.
>
> Commit in another terminal and reply "continue", or reply "continue" to go ahead as things are, or "stop" to end here.

When parts of the build are ignored, add one line to that message: a commit covers only the files git tracks.

Then stop and wait for the user's reply. Write nothing and spawn no one while waiting. `--no-confirm` does not skip this wait: it approves the batch in advance, not the risk to unsaved work. On "continue", go on to step 1 whether or not the user committed; the choice is theirs, and you do not ask again in this run. On "stop", end the run without writing anything.

---

## Step 1 — Check in

### 1a. Earlier issues the user has not tried

Every run starts here, whether it brings a new request or not.

Look through `<build>/docs/issues/` for issues with `Status: built`. These are issues from earlier batches whose code is in but which the user has not said they tried. If the folder does not exist or holds no such issue, print nothing and go on.

If there are some, print a short list, oldest first, and the offer:

> Built in earlier batches and still waiting for you to try:
>
> - 03 <title> (batch 1)
> - 05 <title> (batch 2)
>
> If you have tried any of these in the app and they work, tell me the numbers and I will mark them `confirmed`. You can ignore this; it does not hold up the new batch.

Do not wait for an answer. Carry on with the run in the same turn.

### 1b. Marking an issue confirmed

An issue becomes `confirmed` only when the user says they have tried it and it works. They may say so in the request itself, in their reply at the approval step, or at any later point in the conversation. When they do:

1. Change the issue's header to `Status: confirmed`.
2. Add one line at the end of its Results section: `**Confirmed:** by the user, <today's date>.`

Change nothing else in the file. Rule 1 allows this edit before the approval in step 4: it touches no code and no other file.

Nothing else makes an issue `confirmed`: not a QA pass, not a clean regression run, not your own reading of the code, and not the user's silence. If the user asks for an issue to be marked without saying they tried it, ask once whether they have. If the user never answers the offer, leave the issues `built`; they are listed again on the next run.

If the user says an earlier issue does not work, leave it `built` and treat what they describe as a new request in this batch, with its own issue.

---

## Step 2 — Split the requests

### 2a. Check there is a request

Look in `<build>/docs/issues/` for issues with `Status: approved`. Those are issues the user already agreed to that an earlier run did not finish, most often because the batch stopped in `REFINE_NEEDED`.

If there is request text, this run is a new batch. Leave any `approved` issues from earlier runs out of it; tell the user in one line which numbers are still waiting and that running the command with no request resumes them. Then go to 2b.

If no request text is left after the build folder and any flags, this run is a resume. A prompt that holds only a house rule is not a resume; "Build notes" above covers that run.

**Nothing to resume.** If no issue is at `approved`, print this and stop:

> Nothing to resume: no issue in `<build>` is waiting at `approved`.
>
> Tell me what to change. For example: `/sprint-zero-refine the save button stays greyed out after an error`.

**Something to resume.** Otherwise:

1. Read every `approved` issue file from disk, in full. The user may have edited it since the failed run, and the file as it now stands is what gets built. Its Results section says what failed last time.
2. Print which issues are being resumed, and that no approval is needed:

   > Resuming <count> issue(s) left at `approved`: 05 <title> (batch 2), 06 <title> (batch 2). You approved these already, so I am going straight to the build.

3. Skip the rest of step 2 and all of steps 3 and 4. Write no new issue file, do not ask for approval again, and do not change any issue's number, `Batch:` value, or status. Go to step 5. The resumed issues are this run's issues sent to build. A spec edit that an earlier run already made is not made a second time.

From there a resume is an ordinary run with two differences. Each engineer's brief in step 6b also says that these issues were attempted before, that the Results section of each says what went wrong, and that part of the change may already be in the code. And wherever a later step prints batch `<N>`, use the `Batch:` value of the resumed issues, naming each batch if they come from more than one.

A resume gets the same single retry as any other run (see "When a batch cannot finish"). Issues that fail again stay `approved` and can be resumed again.

### 2b. Split into refinements

Break the prompt into individual refinements. One refinement is one change the user could accept or reject on its own. "The title is cut off on small screens, and the delete button needs a confirmation" is two refinements. Two sentences that describe the same problem are one.

Do not add refinements the user did not ask for, and do not fold a request into another because the same file is involved.

An instruction about how the build may be worked on ("do not drive a browser", "never restart my server") is not a refinement and gets no issue. Handle it as "Build notes" above describes: confirm the wording of a standing rule with the user before going on to step 3, and simply follow a one-off instruction for this batch.

**Two sorts of request are declined.** Neither is a refinement, so neither gets an issue file, a place in the table, or a number, and nothing is built for it.

- **A change to the build configuration**: a different project type, stack profile, or data layer than `<build>/docs/scope.md` records. "Move it to Supabase", "rewrite the frontend in Next.js", and "turn it into a command-line tool" all ask for this. A refinement changes one thing in the build as it stands; a different configuration means different code throughout, which is a new baseline.
- **A rise in scope level**: `clickable` to `MVP`, or `MVP` to `Prod`, whether the user names the level or describes it ("make it production ready", "harden the whole app"). Raising the level reworks the whole build instead of changing one thing, and this command does not support it yet.

Judge by what is asked, not by the words used. One specific change is an ordinary refinement even when it is something a higher scope level would include: "show a message when the upload fails" gets an issue; "add error handling everywhere" is a rise in scope level. If you cannot tell which is meant, treat it as an ambiguous request and ask in step 2e.

Tell the user as soon as the prompt is split, before any question from step 2e and before any issue is written. Quote each declined request and give its reason, using whichever of these applies:

> I am not taking this one on: "<the user's words>"
>
> It asks for a different <project type | stack profile | data layer>, and that cannot be done as a refinement: it needs a new baseline. A new baseline is made by `/sprint-zero`, which builds at the repo root and, run with `--fresh --rebuild`, replaces the build that is there. Commit this build or move it to another folder first if you want to keep it.

> I am not taking this one on: "<the user's words>"
>
> It asks to raise the scope level from `<current level>` to `<level asked for>`, and that is not supported yet. I can still make specific changes one at a time: tell me which screen or behaviour to improve and each becomes its own refinement.

`--no-confirm` does not change this: a declined request stays declined, and the message is still printed.

A declined request never holds up the rest of the prompt. Carry on to 2c with the remaining refinements, which are written, approved, and built as usual. If every request in the prompt was declined, stop after the message: write no issue file, start no batch, and change nothing.

### 2c. Work out the area

For each refinement, read as much of the build as you need to decide whether the change belongs to the server, the client, or both, and to find the exact on-screen labels involved. Read only; change nothing.

### 2d. Choose the track

Sort every refinement into one of the two tracks. Read `<build>/docs/user-stories.md` and, when the server is involved, `<build>/docs/api-contract.md` before you decide.

- **Straight to code** is for a bug fix or a polish item. A bug fix makes the build do what the user stories and the contract already say. A polish item changes how something looks or reads without changing what it does. After either, the spec set is still true as written.
- **Spec first** is for a changed behaviour or a new feature. The build will do something the user stories do not describe, or stop doing something they do describe, or the API will accept or return something the contract does not list.

The test is one question: once this refinement is built, will the user stories and the contract still describe the product correctly, with nothing missing? If yes, the track is straight to code. If no, it is spec first. A request the user calls a "fix" is still spec first when a story's acceptance criteria would have to change to match it, and that includes a change to an on-screen label that a story quotes.

When you cannot tell, choose spec first. An extra line in the user stories costs little; a spec set that no longer matches the product misleads every later batch.

For each refinement, keep a one-line reason for the choice, in plain words that point at the spec set: "bug: story 14 already says Enter saves the title", "polish: wording only, no story quotes it", "new feature: no story covers it", "changed behaviour: story 21 says the opposite". The reason goes in the table in step 4a.

**Then work out the spec changes** for each spec-first refinement. Skip this for straight-to-code refinements: their Spec changes section is `None.` and they change no spec file at any point in the run. For a request that step 2e has to ask about, do it once the answer is in.

Read the spec set and work out what will have to change. Read only; nothing is edited until step 5.

- **User stories.** Which stories change, and which are new. Name a changed story by its number and name as the file has them. Give a new story the next number after the highest in the file, and a name in the file's style. Every spec-first issue changes or adds at least one story.
- **API contract.** Which endpoints, entity fields, or error codes are added or changed. The contract changes only when the server is involved, so only an issue with `Area: server` or `Area: both` can list a contract entry. A `client` issue writes "none (client only)". If a `client` issue turns out to need something the contract does not offer, its area is wrong: make it `both`. A server change that leaves what the API accepts and returns as it is changes no contract entry either; write "none".
- **Decisions.** Any real tradeoff the refinement carries: an earlier decision it reverses, a limit it accepts, something asked for that is deliberately left out. Most refinements have none; write "none". A description of what is being built is not a tradeoff.
- **Scope and PRD.** Leave both out unless the refinement would make a sentence in one of them false, for example a feature the PRD lists as out of scope. Then name the file and quote the sentence.

These lists become the issue's Spec changes section in step 3.

### 2e. Ask about anything ambiguous

A request is ambiguous when you cannot write its Behaviour statements without guessing: it can be read in two ways that would be built differently, or it does not say which screen or which outcome the user means ("make the list nicer"). Check the build first. A question the code or the spec set can answer is not one to ask the user, and neither is a question about how to write the code.

If nothing is ambiguous, go to step 3 without asking anything.

Otherwise ask every question in one message, before writing any issue and before the table in step 4. Number the questions, quote the few words of the request each one is about, and offer the readings you can see so the user can answer in a word.

> Before I write these up, I need to check <count> thing(s):
>
> 1. "<the words in question>": <question>? <reading A, or reading B>
>
> Answer what you can. Anything left unanswered is saved as `needs-info` and is not built in this batch.

Stop and wait for the reply. This wait happens even with `--no-confirm`: a wrong guess costs more than a pause.

Ask once. Do not follow up with more questions. A question counts as unanswered when the reply skips it, puts it off, or does not settle it. The requests that needed no question, and those whose question was answered, carry on as normal.

---

## Step 3 — Write the issues

Create `<build>/docs/issues/` if it does not exist. Write one file per refinement, using the name, number, and layout in "Issue files" above, with `Status: proposed`.

Write the files in the order the user gave the requests, so the numbers follow the prompt.

When a question from step 2e was answered, record it in the issue's Request section, under the quoted request: a line `Clarified: <the question>` followed by the user's answer, quoted unchanged. Write the Behaviour section from the answer.

A refinement whose question is still unanswered gets a file too, with `Status: needs-info` in place of `proposed`. Under the quoted request add a line `Waiting on: <the question>`, and make the Behaviour section the single line `Not written yet: waiting on the answer above.` Give Track and Area your best reading for now. A `needs-info` issue is not approved and not built.

If the prompt answers the question of a `needs-info` issue left by an earlier batch, do not write a second issue for it. Update that file: replace the `Waiting on:` line with the `Clarified:` line and the answer, write its Behaviour, give it this batch's number, and set `Status: proposed`. It keeps its own number and joins this batch.

If `<build>/docs/build-notes.md` does not exist, this is the build's first refinement: create the file now from the template in "Build notes" above. If the user agreed the wording of a house rule in step 2, write it under `## House rules` now.

---

## Step 4 — Wait for approval

### 4a. Print the table

Print one row per `proposed` issue of this batch, then the question. Print the table on every run, including when the wait is skipped.

```
REFINEMENT BATCH <N> — PROPOSED
===============================
Build: <build>

| #  | Title                         | Track            | Why this track                              | Area   | File                                          |
| -- | ----------------------------- | ---------------- | ------------------------------------------- | ------ | --------------------------------------------- |
| 04 | <title>                       | straight to code | bug: story 14 already says this             | client | <build>/docs/issues/04-<slug>.md              |
| 05 | <title>                       | spec first       | new feature: no story covers it             | both   | <build>/docs/issues/05-<slug>.md              |
```

"Why this track" is the one-line reason from step 2d. Under the table, before the question, say in one or two plain sentences that spec-first issues update the spec set before any code is written and list what will change under "Spec changes", and that the user can move an issue to the other track by telling you or by changing its `Track:` line.

> Nothing has been changed yet. Read the issues, edit the files if anything is off, and reply "approve" when you are happy for me to build them. To leave some out, say which, for example "approve all but 05".

If the batch has `needs-info` issues, list them under the table, outside it, one line each:

> Waiting on your answer, and not built until then:
> 06 <title>: <the question>

When the wait is skipped (`--no-confirm`, or the same in plain words), print this in place of the question and go straight to 4c:

> You asked me not to wait, so I am building these now.

If no issue of the batch is `proposed`, because every one is `needs-info`, print the list and stop. There is nothing to approve yet.

### 4b. Wait

Stop and wait for the user's reply. Do not spawn anyone and do not write to any file while waiting.

When the reply comes, it may hold more than a yes or a no. Before approval, make only the writes rule 1 allows: the edits to this batch's issues described below, an earlier issue the reply says the user tried (step 1b), and a house rule once its wording is agreed (see "Build notes").

If the user asks for a change to an issue, edit that issue file, print the table again, and wait again. If the reply answers the question of a `needs-info` issue, rewrite that issue as step 3 describes for an answered question, set it to `Status: proposed`, print the table again, and wait again.

One reply can approve some issues and reject others: "approve 04 and 06, drop 05", or "all but 05". Take every issue the reply does not reject as approved, and go to 4c. If it is unclear which issues the user means, ask before changing any status.

If the user rejects every issue, mark them all `dropped` as 4c describes, say that nothing was built, and stop. If the user only wants to pause ("not now", "let me think"), stop here without building and leave the files as they are.

The user may overrule a track. When they ask for an issue to move to the other track, change its `Track:` line and rewrite its Spec changes section to match: the list from step 2d when it moves to spec first, `None.` when it moves to straight to code. In the table, the reason for that issue becomes "your choice". If moving an issue to straight to code will leave a user story saying something the product no longer does, say so in one line, naming the story, and then do as the user asked.

### 4c. Re-read, then mark approved

When the user approves, read every issue file of this batch again from disk before doing anything else. The user may have edited them, and the file as it now stands is what gets built: its Behaviour, its Area, and its title replace whatever you remember writing. A file whose status the user changed to `dropped` by hand is a rejected issue.

The same goes for the track. The `Track:` line in the file decides what happens in step 5, whatever you proposed. If the user changed a `Track:` line to `straight to code`, set that issue's Spec changes to `None.` and change no spec file for it. If the user changed one to `spec first` and its Spec changes section is still `None.`, work the list out as in step 2d, write it into the file, show it to the user, and wait for their agreement on that issue before going on: a spec-first issue always lists its spec changes before it is approved. If the user edited the Spec changes list itself, the edited list is the one step 5 follows.

For each issue the user rejected, change its status to `Status: dropped` and change nothing else in it. Never delete, rename, or renumber a dropped issue's file: it is the record of what the user decided against.

Then change `Status: proposed` to `Status: approved` in each remaining `proposed` file, and print:

> Batch <N> approved: <count> issue(s). Starting the build.

When issues were dropped or are waiting on an answer, add a line saying which: `Dropped: 05.` and `Waiting on your answer: 06.`

From here to the end of the run, only the `approved` issues are worked on. The rest of this file calls them the issues sent to build.

`dropped` and `needs-info` issues are not sent to an engineer or to QA. Their status and Results section stay as they are through step 8, and they never put the run in `REFINE_NEEDED`. In the batch summary of step 8c each one still gets a row, showing its status and "not built".

---

## Step 5 — Edit the spec set

This step covers the approved issues whose header says `Track: spec first`. A straight-to-code issue changes no spec file, in this step or any other. If the batch has no spec-first issue, print "No spec changes in this batch." and go to step 6.

You make these edits yourself, in place, before any engineer is spawned. The engineers and QA then read the updated files, so the spec set stays the shared truth. One approval covered both the spec edits and the code; do not ask again.

Do not invoke `/user-story-writer`, `/api-contract-writer`, `/decisions-writer`, or `/prd-generator`. Each of them writes a whole file from scratch and would discard what is there.

Three things hold for every edit in this step:

- Read the whole file first and copy the format it already uses: its heading style, its field names, its numbering, the way it words acceptance criteria or endpoint entries. Do not introduce a new layout, and do not reword, reorder, or renumber anything the issues do not require.
- Edit only what the issue's Spec changes section lists. If an edit turns out to need more or less than the list says, make the edit the Behaviour section calls for and correct the list in the issue file so it matches what changed.
- If the file already says what the issue requires, because an earlier run got this far before stopping, leave it as it is.

### 5a. User stories

Edit `<build>/docs/user-stories.md` for every spec-first issue.

For a new story, use the next number after the highest in the file; numbers are never reused. Place it at the end of the priority group it belongs to, with every field the file's other stories have, which is normally the story sentence, the acceptance criteria, priority, and effort. If earlier refinement stories in the file carry a note saying which batch added them, add the same note.

For a changed story, keep its number and heading and edit only the acceptance criteria, or the story sentence, that the refinement makes untrue or incomplete.

Acceptance criteria say the same thing as the issue's Behaviour section, with the same on-screen labels in quotes, written the way the file writes its criteria. Every Behaviour statement should be covered by a criterion in some story.

If another part of the file would now be wrong, such as a line listing the new feature as not included, correct that line and nothing around it.

Keep a list of the stories this step added or changed, by number and name, including any that an earlier run of the same issues already wrote. Step 7 hands it to QA.

### 5b. API contract

Edit `<build>/docs/api-contract.md` only for a spec-first issue whose area is `server` or `both` and whose Spec changes section lists a contract entry. A `client` issue never changes the contract.

Add or change the listed endpoints, entity fields, and error codes in the format of the entries already in the file: the same parts in the same order, with request and response examples where the others have them. Use the file's existing error shape and conventions. If a changed field also appears in the entities section or in other endpoints' examples, bring those in line.

The contract is edited here, before step 6, so that both engineers build to the same contract and no code is written against an entry that does not exist yet.

### 5c. Decisions

Gather the tradeoffs from the Spec changes sections of all spec-first issues in the batch. If there are none, do not touch `<build>/docs/decisions.md`: add no heading and no "nothing to record" line.

If there is at least one, add a single section at the end of the file, headed `## Refinement batch <N>`, and put every tradeoff of the batch under it. One heading per batch, not one per issue. If the heading already exists for this batch, add to it.

Under the heading, write one short sentence saying what the batch contains, then one entry per tradeoff in the style the file's other sections use. Each entry names the choice and its cost in plain words, and says so when it reverses an earlier decision, naming that decision. The issue files are the record of what was asked and built; this section holds only the choices someone might later ask "why?" about.

### 5d. Scope and PRD

Leave `<build>/docs/scope.md` and `<build>/docs/prd.md` untouched unless a spec-first issue's Spec changes section names one of them because the refinement would contradict it. Then change only the sentence or list item that would be false, in as few words as will make it true. Never change the scope level or the build configuration recorded in `scope.md`.

### 5e. Say what changed

Print one line per spec file, including the ones left alone:

> Spec set updated for batch <N>.
>
> - User stories: <stories added or changed, by number and name>
> - API contract: <entries added or changed | not changed>
> - Decisions: <"Refinement batch <N>" added with <count> tradeoff(s) | not changed>
> - Scope and PRD: <not changed | what changed>

---

## Step 6 — Build

### 6a. Decide who to spawn

Spawn only the engineers whose area an approved issue touches.

- Issues with `Area: server` go to `backend-engineer`.
- Issues with `Area: client` go to `frontend-engineer`.
- An issue with `Area: both` goes to both.

If no approved issue touches the server, do not spawn `backend-engineer`. If none touches the client, do not spawn `frontend-engineer`. For `api-service` and `cli-tool` builds there is no frontend, so every issue is `server` and only `backend-engineer` runs.

Each engineer is spawned once per batch and receives all of its issues together. When both are needed, spawn them in the same turn so they work in parallel.

Print which engineers you are spawning and for which issue numbers.

### 6b. Write the brief

The approved issues are the brief. Each engineer's prompt contains:

- That this is a refinement, and that the engineer must follow the "Refinement mode" section of its instructions.
- The build folder, and that every path in its instructions (`docs/`, `server/`, `client/`, `app/`, `cli/`) is relative to that folder.
- The path of the build notes, `<build>/docs/build-notes.md`, with the instruction to read it first, before the issues: its house rules override the engineer's defaults, and its constraints are what earlier batches learned. Also that the engineer appends any constraint it discovers under `## Constraints` when it finishes.
- Any one-off instruction the user gave for this batch that affects the engineer's work, in the user's words.
- The batch number and the paths of the approved issue files for its area, with the instruction to read them before changing anything.
- The resolved build configuration and scope level.
- For spec-first issues, that the spec set was already updated in step 5, with the story numbers and contract entries that changed, and the instruction to read those after the issues and build to them.
- For an issue with `Area: both`, that the other engineer is working on the other side of the same issue at the same time.

Do not paste the issue text into the prompt and do not describe a solution. The engineer reads the files.

The `backend-engineer` prompt also carries the data rule, in these words or close to them: the build's database holds the user's own data; any schema change must be additive and must be applied by the backend itself when it starts, so the records already there survive; the seed script is never run in the build folder.

### 6c. Collect the results

Each engineer returns one result per issue it was handed: `done`, `failed`, or `no change needed`, with the files it changed. Keep these for step 8.

An issue is ready for QA when every engineer it was sent to returned `done` or `no change needed` for it. If an engineer returns `failed` for an issue, or returns no result for it, that issue has failed: keep its status `approved` and keep the engineer's explanation for its Results section.

### 6d. Retry a failed issue once

If any issue failed in 6c, re-spawn the engineer that failed it, once. Print which engineer you are re-spawning and for which issue numbers. If both engineers failed issues, re-spawn both in the same turn.

The retry brief is the brief from 6b, cut down to the issues that engineer failed, plus:

- That this is a retry of a failed attempt, and the only one.
- The engineer's own failure report for each issue, word for word. If it returned no result for an issue, say that.
- That it should fix what the report describes and return a result per issue in the same format as before.

Do not suggest a fix. The engineer reads the report and the issue.

Take the retry's results in place of the first ones. An issue the retry returned `done` or `no change needed` for is now ready for QA. An issue that failed again is not retried a second time: it stays `approved`, the run will end in `REFINE_NEEDED`, and both failure reports go into its Results section.

Do not stop here. The other issues of the batch still go to QA in step 7, so that work which passed is not held back by work which failed.

---

## Step 7 — Verify

Spawn `qa-engineer` once for the batch, after every engineer has returned. Skip this step only if no issue is ready for QA.

Print:

> Build step finished. Spawning qa-engineer to check batch <N>.

The QA prompt contains:

- That this is a refinement, and that QA must follow the "Refinement mode" section of its instructions.
- The build folder, and that every path in its instructions is relative to that folder.
- The path of the build notes, `<build>/docs/build-notes.md`, with the instruction to read it first, before the issues: its house rules override QA's defaults, and anything a house rule stops QA from checking is reported as untested with a click-through item.
- Any one-off instruction the user gave for this batch that affects how QA may check, in the user's words.
- The batch number and the paths of the issue files that are ready for QA.
- The resolved build configuration, scope level, directories, run commands, and ports.
- Which engineers ran and which files each reported changing.
- The stories the batch added or changed, by number and name, from step 5a, each with the issue it belongs to, and the instruction to report one check per story. When the batch has no spec-first issue, say "No stories changed in this batch."
- Whether the batch touches auth, in one line with the reason, and so whether the full auth sequence must be run. The paragraph below says how to decide.
- That the existing tests must run against a temporary copy with a freshly seeded database, never against the build folder's own database, and that nothing already running may be stopped.

A batch touches auth when an approved issue changes signing up, logging in, logging out, how the session is kept, which pages or endpoints need a login, or how the server works out who a request comes from; or when an engineer reported changing a file that does any of those (the auth routes or middleware, the session context, the protected route wrapper, the login or signup page). When neither is true, tell QA the batch does not touch auth and that the full auth sequence must not be run. The existing tests still run in every batch, and they include whatever auth tests the build already has.

QA returns one regression result for the batch, the frontend build result, one line per regression failure naming the issues QA believes are implicated or saying "cannot tell", one check per story named in the brief, the auth sequence result when it was asked for, and one result per issue: what it checked, what it could not check, and a click-through list for the user. If the report has no check for a story you named, that story is untested; say so in the issue's Results. Anything QA could not check is untested. Never report it as passing, and never fill a gap in QA's report from your own reading of the code.

### If QA reports a failure

A failure is either of these in QA's report: an issue marked `fail`, or a regression failure. A regression failure is a failing existing test or a failing frontend build; the two are treated alike. An untested item is not a failure.

Re-spawn the responsible engineer once, with QA's failure report, then run QA once more.

1. Work out who is responsible, choosing only among the engineers spawned in this run. Never spawn an engineer for an area the run did not touch.
   - If only one engineer was spawned, it is that one, whatever failed and whichever area the failing check is in.
   - If both were spawned and an issue failed, it is the engineer for that issue's area; for `Area: both`, the one QA's report points to, or both if it does not say.
   - If both were spawned and there is a regression failure, it is the engineer whose changed files the failure points to, or both if it points to neither.
2. Leave out any issue that was already retried in 6d. An issue gets one retry per run, so it has failed: it stays `approved`.
3. Print who you are re-spawning and why, then spawn. The brief is the one from 6b, cut down to the issues involved, plus: that this is a retry after QA and the only one; QA's failure text, word for word; and that the fix belongs in the code, not in the existing tests. For a regression failure, hand the engineer those of its issues that QA named as implicated, or all of its issues from this run when QA wrote "cannot tell".
4. When the retry returns, spawn `qa-engineer` again with the same prompt as before, adding the files the retry changed. This second report replaces the first for step 8.

Whatever the second report says, do not retry again and do not run QA a third time. If it still shows a failure, the issues it fails, and the issues a regression failure implicates under the rule in step 8a, stay `approved` and the run ends in `REFINE_NEEDED`.

---

## Step 8 — Report

### 8a. Set each issue's status

This step and 8b cover the issues sent to build (see step 4c). A `dropped` or `needs-info` issue was never built: leave its status and its Results section exactly as they are.

An issue sent to build becomes `built` when all of these are true: every engineer it was sent to returned `done` or `no change needed`, QA's result for the issue is `pass`, and no regression failure implicates it. Change its header to `Status: built`.

A regression failure is a failing existing test or a failing frontend build in QA's last report. For each one, the report names the issues QA believes are implicated, or says "cannot tell". The issues QA names are implicated. If QA says "cannot tell" for any regression failure, every issue sent to build is implicated. This is the only rule for a regression failure: an issue it does not implicate still becomes `built` if its own checks passed.

Every other issue sent to build stays `approved`. That covers an issue an engineer failed, an issue QA failed, and an issue a regression failure implicates.

An issue with untested items can still be `built`. Built means the code is in and the automated checks that could run have passed; the untested items go to the user as a click-through list.

### 8b. Write the results into each issue

Replace the contents of the Results section in the file of each issue sent to build. Keep to this shape.

```markdown
## Results

Batch <N>, <today's date>.

**Built by:** <engineer(s)>. Files changed: <list>.

**Checked by QA:** <what QA ran and saw, in one or two sentences, including the regression count>

**Untested:** <what QA could not check and why, or "nothing">

**Click-through:**

- <one thing for the user to do and what they should see, using the exact on-screen labels>
```

For an issue that stays `approved`, write what failed in place of the "Checked by QA" line, in the engineer's or QA's own words, and leave out the click-through list. Start that line with `**Failed:**`, and say that one retry was made and what it reported, so the user reads both attempts. If the issue's own checks passed but a regression failure implicates it, say that instead: name the failing test or the frontend build, and say whether QA named this issue or could not tell.

For a spec-first issue, the "Checked by QA" line also names each story the issue added or changed and QA's result for it (`pass`, `fail`, or `untested`). An issue with a story check that failed is not `built`.

### 8c. Print the batch summary

Print one row per issue of the batch, then the combined click-through list.

```
SPRINT ZERO — REFINEMENT BATCH <N>
==================================
Build: <build>
Regression: <X/Y existing tests passed against a temporary copy | untested: reason | N/A: reason>

| #  | Title                         | Status   | What QA checked                                   |
| -- | ----------------------------- | -------- | ------------------------------------------------- |
| 04 | <title>                       | built    | <one line; say "untested" where nothing was run>  |
| 05 | <title>                       | approved | <one line on what failed>                         |
| 06 | <title>                       | dropped  | not built                                         |

Try these yourself (nothing below was checked automatically):

Issue 04 — <title>
  - <click-through item>
  - <click-through item>
```

An issue sent to build shows the status step 8a gave it. A `dropped` or `needs-info` issue shows the status it already had and "not built" in the last column.

The click-through list gathers the items from every built issue, grouped by issue, in issue order. If no issue has any, print "Nothing needs trying by hand." in its place.

After the table, add one or two plain sentences: that `built` means the code is in and the automated checks passed but nobody has tried it in the app yet, and, if the server changed and the app is already running, that the server needs a restart before the changes show.

If any issue sent to build is still `approved`, the run ends in `REFINE_NEEDED`. A `dropped` or `needs-info` issue never causes that. Say so here in one line and carry on with 8d and 8e. Step 8f then prints the state and its recovery instruction.

### 8d. Suggest a commit

If at least one issue of the batch is `built`, and the build is in a git repository, end the summary by suggesting a commit. Do not make it yourself. Print the commands for the user to run, with a message that names the batch:

> To save this state, commit it yourself when you are ready (I do not commit for you):
>
> ```bash
> git add <build>
> git commit -m "Refinement batch <N>: <the built issues' titles, shortened>"
> ```

Under the commands, say what the commit will and will not capture, using the list of ignored paths from the git check before step 1.

If nothing was ignored:

> This captures every tracked file in the build folder. Files git ignores, such as a local database, are left out.

If some paths were ignored:

> This captures only what git tracks in the build folder: <for example, the issue files and the build notes>. It does not capture <the ignored paths>, because git ignores them, so the commit is not a restore point for those parts. Copy the build folder if you want one.

If no issue was built, or the git check found no repository, leave this step out.

### 8e. Start the app, or ask before a restart

The app may be running, and the user may be in the middle of something in it. Never stop a process without the user's agreement, and never run the seed script here: the backend creates and updates its own tables when it starts.

Use the directories, run commands, and ports resolved from `<build>/docs/scope.md` and `.claude/stacks.md` before step 1. Run every command from inside `<build>`. Do not assume the `node-react` values.

Every branch below ends by going to 8f. Two of them ask the user a question first. When the run is ending in `REFINE_NEEDED`, print the state as 8f describes before asking, in the same message, so that it is on screen whether or not the user answers. Do not print it a second time after the answer.

For a `cli-tool` there is nothing to start. Print one example command and go to 8f.

**With `--no-launch`.** Start nothing, stop nothing, and open nothing. Print the run command for each part of the build, with the folder to run it in, and add that a server already running needs a restart to pick up backend changes. Go to 8f.

**Otherwise, check each of the build's ports** to see whether something is listening, for example with `lsof -nP -iTCP:<port> -sTCP:LISTEN` on macOS or Linux, or `netstat -ano | findstr :<port>` on Windows. This only looks; it stops nothing.

**If every port is free**, start the app as the baseline run does, minus the seed:

1. Install dependencies only where they are missing or where an engineer reported changing the dependency file (`package.json` or `requirements.txt`). Print one line per install.
2. Start the backend (or the single `nextjs` app) in the background with its resolved run command, and record its process ID. Wait two seconds, then check it answers: `curl -s -o /dev/null -w "%{http_code}" http://localhost:<backend-port>/`. Any HTTP response means it is up.
3. For a `web-app` with a separate frontend, start the frontend the same way and check its port.
4. Open the app: the frontend address for a `web-app`, the API root (or `/docs` for FastAPI) for an `api-service`. Use `open`, `xdg-open`, `wslview`, or `cmd.exe /c start` as the system provides. If none works, print the address instead.
5. Print the addresses, the process IDs, and how to stop each one later by its process ID (`kill <pid>`). Print no demo login: the seed was not run, and the user's own accounts are still there.

If a part does not come up, say which and print its run command. Do not retry, and do not stop or change anything else to make room for it. Go to 8f.

**If something is listening on any of the build's ports**, treat the app as running. Stop nothing and start nothing yet. Print which ports are in use and by what (the process ID from the check above and its command line, `ps -p <pid> -o command=`), then:

- If only the client changed in this batch, say that the changes show after a refresh in the browser and no restart is needed. Go to 8f.
- If the server changed (the backend engineer reported changed files), say that the backend needs a restart before those changes show, and ask:

  > The backend on port <backend-port> is already running (process <pid>: `<command line>`). It needs a restart to pick up this batch. Restarting it will interrupt anything in progress in the app. Shall I restart it, or will you?

  Wait for the reply. If the user agrees, stop that one process by its process ID with `kill <pid>`, start the backend again with its resolved run command, check it answers, and print its new process ID. Do not use `pkill`, do not stop any other process, and do not touch the frontend. If the user declines or does not answer plainly, leave it running and print the run command so they can restart it themselves. Go to 8f.
- If a part of the build is not running while another is (for example the frontend is up and the backend port is free), say so and ask whether to start the missing part. Start it only on a yes. Go to 8f.

### 8f. End the run

If any issue sent to build is still `approved`, print the `REFINE_NEEDED` state and its recovery instruction, as set out in "When a batch cannot finish", unless 8e already printed it ahead of a question. It is the last thing the run prints apart from the outcome of such a question.

Otherwise there is nothing more to print, and the run ends here.

<!-- $ARGUMENTS is the interpolation token Claude Code replaces with everything the user typed after /sprint-zero-refine. It must appear in the file for the build folder and the requests to be accessible throughout these instructions. -->
$ARGUMENTS
