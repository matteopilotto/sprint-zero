# Sprint Zero — CLAUDE.md

> This file is Claude Code's briefing document for the Sprint Zero repo.
> Read this before touching any file. It is the single source of truth for
> what this project is, how it's wired, and what the rules are.

---

## What is Sprint Zero?

Sprint Zero is a cloneable Claude Code kit that turns a reference URL plus three scoping answers into a complete spec set and a working product. The user points Sprint Zero at something similar to what they want to build, answers one multi-part scoping question, and a team of sub-agents produces:

- A full spec set in `docs/` (scope, reference brief, PRD, decisions, user stories, API contract)
- A working build whose stack is chosen at scoping time (see "Build configuration" below) — by default a local SQLite-backed Express + React app that runs with no external account
- QA calibrated to the build — browser-driven for web apps, API-level for services, command runs for CLIs

The audience is PMs, founders, and non-developers who can follow terminal output but don't write code. Every decision in this repo prioritises:

- Clarity over cleverness
- Demo-readiness over production hardening
- Visible outputs over elegant internals
- The user's judgement over inferred defaults

---

## Scope levels

The user picks one of three levels up front. The scope level drives every downstream agent's behaviour.

| Level       | What it produces                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `clickable` | Mock backend, fake data, no auth. Useful for pitching and flow reviews.                                           |
| `MVP`       | Real data + real auth via the chosen data layer, one core loop works end-to-end. The main v1 target.              |
| `Prod`      | MVP plus error boundaries, loading states, input validation, and a happy path + one error path test per loop.     |

`docs/scope.md` is the lever that carries this choice — and the build configuration above — through the pipeline. The scope level is independent of the data layer: `clickable` is mock-only regardless, while `MVP`/`Prod` use whichever data layer was chosen.

---

## Build configuration

The build is configured by three orthogonal choices captured during scoping, on top of the scope level. The full catalog — concrete dirs, ports, run commands, and test strategy for every combination — lives in `.claude/stacks.md`, which every agent reads. Do not hardcode a stack assumption anywhere else.

- **Project type** — `web-app` (UI + API), `api-service` (API only, no frontend), or `cli-tool` (a command-line program).
- **Stack profile** — `node-react` (Express + React/Vite), `nextjs` (one Next.js app, UI + API together), or `python-react` (FastAPI + React/Vite).
- **Data layer** — `local` (SQLite + a self-issued JWT, **zero external setup**) or `supabase` (hosted Postgres + Supabase Auth, needs a `.env`).

**Default: `web-app` + `node-react` + `local`.** That default clones and runs with no account, no keys, and no `.env`. Supabase is opt-in. `docs/scope.md` records all three choices and carries them through the pipeline alongside the scope level.

Testing is Playwright (via Playwright MCP) for web apps, HTTP integration tests for API services, and command-output assertions for CLIs.

---

## Architecture, one line

URL → scoping conversation → spec set (PRD, decisions, stories, contract) → parallel build (backend + frontend) → QA with browser-driven tests → working product.

That line is the first run, which produces the baseline. Changes after it go through `/sprint-zero-refine`: requests in plain words → one issue per request → the user's approval → spec edits where behaviour changes → the engineers whose area is touched → QA against a temporary copy → batch summary. See "Refinement" below.

---

## Repo structure

```
sprint-zero/
├── CLAUDE.md                 ← you are here
├── README.md                 ← public-facing description
├── plan.md                   ← phased build plan for this repo itself
├── LICENSE                   ← MIT, Yousuf Alvi
├── .env.example              ← only needed for the supabase data layer (local needs none)
├── .gitignore
├── .claude/
│   ├── stacks.md             ← the build-configuration catalog (read by every agent)
│   ├── commands/             ← slash commands (Phase 2)
│   └── agents/               ← sub-agents (Phase 3)
├── docs/                     ← generated spec files live here per run
└── examples/
    └── mini-twenty/          ← worked example (Phase 5, committed build)
```

Files generated at runtime (per user run):

- `docs/scope.md` — scoping answers, structured
- `docs/reference-brief.md` — extracted brief of the reference URL
- `docs/prd.md` — product requirements
- `docs/decisions.md` — scope cuts and tradeoffs, tied to the chosen level
- `docs/user-stories.md` — user stories
- `docs/api-contract.md` — the contract all agents build to
- `server/` / `client/` (node-react, python-react) or one `app/` (nextjs) or `cli/` (cli-tool) — the build, per the resolved stack profile
- `*.db` — the SQLite file for the `local` data layer (gitignored)
- `docs/issues/NN-<slug>.md` — one issue file per refinement, written by `/sprint-zero-refine` and kept with the spec set
- `docs/build-notes.md` — the build notes: the user's house rules and the constraints engineers discovered, created on the build's first refinement
- `.claude/settings.local.json` — demo-time permissive settings, gitignored

---

## Agent topology

Sprint Zero's build layer has one briefing sub-agent (tech-lead) and three worker sub-agents (two engineers, one QA). **The main Claude Code session is the orchestrator — it is the only thing that spawns sub-agents.** tech-lead does not spawn anyone; it reads specs and hands a build brief back to the main session, which then spawns the workers. This is a hard Claude Code constraint, not a stylistic choice: a sub-agent cannot spawn another sub-agent (the `Task` tool is stripped from nested contexts), and tech-lead is declared with `tools: Read` only. See "Build orchestration pattern" below for the full rationale.

```
You
  │
  └─ main session  (the orchestrator — the only thing that spawns)
        │
        ├─ 1. invoke tech-lead ........ reads specs → returns a build brief
        │                               (tools: Read only — no code, no spawning)
        │
        ├─ 2. spawn IN PARALLEL ......  backend-engineer   (API or CLI, per stack profile + data layer)
        │                              frontend-engineer  (web-app only; React/Vite or Next.js pages)
        │
        └─ 3. after both finish ......  qa-engineer        (browser / API / CLI, per project type)
```

Which engineers run depends on the project type — `frontend-engineer` is spawned only for `web-app`.

### tech-lead (briefing only — does not spawn)

- Reads `docs/scope.md` (scope level + build config), `docs/prd.md`, `docs/api-contract.md`, `docs/decisions.md`, and resolves the config against `.claude/stacks.md`
- Returns a build brief: what it understood, the resolved dirs/ports, and a **recommended** execution order (which engineers the main session should spawn, and in what order)
- Does **not** spawn engineers or QA, and does not write application code — `tools: Read` only. The main session acts on the recommendation.

### backend-engineer

- Builds the API (Express / FastAPI / Next.js route handlers) or, for `cli-tool`, a command-line program — per the resolved stack profile
- Data access + auth per the data layer: `local` → SQLite + a self-issued JWT (`/auth/*` endpoints), `supabase` → `@supabase/supabase-js` + JWKS verification
- Seed script creates the schema (SQLite or via migration) and a demo user with realistic data
- Builds strictly to `docs/api-contract.md`

### frontend-engineer (web-app only)

- Builds the UI — React + Vite in `client/`, or pages inside the Next.js `app/`
- Auth per the data layer: `local` → calls the backend `/auth/*`; `supabase` → Supabase Auth SDK. Login, signup, session context, protected route wrapper
- Product screens come from `docs/user-stories.md` and the contract
- Form patterns standardised so QA can drive them

### qa-engineer

- `web-app`: the full auth dance (signup, session, logout, login, protected route, 401) + core loop in a real browser via Playwright
- `api-service`: contract + HTTP integration tests, auth verified at the API level (no browser)
- `cli-tool`: runs the CLI with sample args and asserts on stdout/exit codes
- At `Prod` scope, adds one error-path test per loop. Reports pass/fail back to the main session, which writes the delivery summary

---

## Refinement

A finished `/sprint-zero` run leaves a baseline: the build as first produced. Every change after that is a refinement, made with `/sprint-zero-refine [build folder] <requests in plain words> [--no-confirm] [--no-launch]`. The full instructions are in `.claude/commands/sprint-zero-refine.md`; this section is the summary every session should hold.

### Vocabulary

A build is one generated product, its spec set and its code together in one folder. A refinement is one requested change to a build that has a baseline: a bug fix, a polish item, a changed behaviour, or a new feature. A batch is the group of refinements requested in one invocation, built and verified together. An issue is the file that describes exactly one refinement. Use these words as given; do not swap in "ticket", "round", or "tweak".

### The workflow

The command works on the build at the repo root unless the first argument names a build folder, such as `examples/loom-clone`. A folder is a build only when it holds `docs/scope.md`; anything else is refused and nothing is written. One invocation is one batch.

1. **Find the build and check git.** If the build folder has uncommitted changes, the command recommends a commit and waits for the user's choice. It never commits, stages, or branches itself. Outside a git repository it warns once and carries on.
2. **Check in.** It lists issues from earlier batches that are still `built` and offers to mark them `confirmed`. This does not hold up the new batch.
3. **Split the requests.** Each request becomes one refinement, with an area (`server`, `client`, or `both`) and a track. Anything ambiguous is asked about once, in a single message.
4. **Write the issues.** One file per refinement in `docs/issues/`, numbered continuously across batches. Each has a header (status, batch, track, area) and four sections: Request (the user's words, unchanged), Behaviour (checkable statements with the exact on-screen labels), Spec changes, and Results.
5. **Wait for approval.** A table of the proposed issues is printed and nothing in the spec set or the code changes until the user approves. The user may edit the files, drop individual issues, or move an issue to the other track; the files are read again from disk before anything is built. `--no-confirm`, or the same in plain words, skips the wait but not the table.
6. **Edit the spec set** for spec-first issues, in place, before any code is written.
7. **Build.** Only the engineers whose area is touched are spawned, in parallel when both are. The approved issues are the brief.
8. **Verify.** `qa-engineer` runs once per batch.
9. **Report.** Each issue's status and Results section are updated, then a batch summary is printed: one row per issue, a click-through list of what only the user can check, and a suggested commit. The app is started if its ports are free; if it is already running, nothing is stopped without the user's agreement. `--no-launch` leaves starting it to the user.

The main session is still the only orchestrator. It writes the issue files and edits the spec set itself, but it never edits build code, however small the change. `tech-lead` is not invoked in a refinement, and the four spec-writer commands are not used, because each rewrites its file from scratch.

Running the command with no request resumes issues left at `approved` by a batch that could not finish. An engineer or QA failure gets one automatic retry. If it fails again the run ends in the named state `REFINE_NEEDED`: issues that passed are still `built`, and the ones that failed stay `approved` with the failure written in their Results.

### The two tracks

The track is the route a refinement takes to the code. The orchestrator chooses it, gives a one-line reason, and the user may overrule.

| Track              | For                                  | What happens                                                                          |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------- |
| `straight to code` | A bug fix or a polish item           | No spec file changes. The spec set is still true as written once the change is built. |
| `spec first`       | A changed behaviour or a new feature | The spec set is edited before any code is written, so the contract stays the shared truth. |

On the spec-first track the user stories always change, the API contract changes only when the server is involved, and the decisions file gains an entry only for a real tradeoff, under one `## Refinement batch <N>` heading per batch.

The test is whether the user stories and the contract will still describe the product correctly once the refinement is built. When in doubt the track is spec first. `scope.md` and `prd.md` are left alone unless a refinement would make one of their sentences false, and the scope level and build configuration recorded in `scope.md` never change.

### Status lifecycle

Every issue has exactly one status, on the `Status:` line of its header.

| Status       | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `needs-info` | The request is ambiguous and a question is waiting on the user          |
| `proposed`   | Written and waiting for the user's approval                             |
| `approved`   | The user agreed; work may start                                         |
| `built`      | The code is in and automated checks pass, but the user has not tried it |
| `confirmed`  | The user has tried it and accepted it                                   |
| `dropped`    | The user decided against it                                             |

Built and confirmed are different on purpose. Only the user's own statement that they tried a change makes an issue `confirmed`; a QA pass never does. Only the user drops an issue, and a dropped issue's file is kept as the record of what was decided against.

These statuses belong to generated builds. They are unrelated to the triage labels under "Agent skills" below, which are for work on the kit itself and live in `.scratch/`.

### Data rules

Once a baseline exists, the build's database holds the user's own data, not test data.

- The seed script is never run in the build folder during a refinement, by the orchestrator or by any sub-agent.
- Schema changes are additive (a new table, or a new column that is nullable or has a default) and the backend applies them itself when it starts, so existing records survive.
- QA runs the build's existing tests against a temporary copy of the server with a freshly seeded database, on a spare port. It never tests against the build's own database or its running server.
- Nothing already running is stopped without the user's agreement.
- Anything QA could not check is reported as untested, with a click-through item for the user. It is never reported as passing.

### Build notes

`docs/build-notes.md` carries what one batch learned to the next. It has two sections. House rules are standing instructions from the user about how the build may be worked on, for example "do not drive a browser"; the orchestrator writes them only after the user has agreed the wording, and they override the agents' defaults and the command's own steps. Constraints are facts about how the build works that no spec file holds; engineers append them when they finish, and this is the only file in `docs/` an engineer writes to during a refinement. Every engineer and QA brief says to read the build notes first.

### What the command declines, and the guard

A request to change the build configuration (project type, stack profile, or data layer) is declined: it needs a new baseline. A request to raise the scope level is declined: it is not supported yet. Neither gets an issue, and the other requests in the same prompt go ahead.

`/sprint-zero` has a matching guard. Run without `--fresh` or `--rebuild` on a folder that already holds a finished baseline, it prints a pointer to `/sprint-zero-refine` and stops. A run that was interrupted before finishing still resumes as before.

### Worker agents in refinement mode

`backend-engineer`, `frontend-engineer`, and `qa-engineer` each have a "Refinement mode" section. In it they read the build notes and the approved issues first and return one result per issue in place of the baseline completion message. The engineers change only what the issues require and leave working code as it is; QA changes nothing and reports.

---

## Key files Claude Code should read first

When starting a session on this repo, read in this order:

1. `CLAUDE.md` (this file) — project context and rules
2. `plan.md` — what's built, what's next, what's out of scope
3. `README.md` — the public-facing story, to stay consistent with it

When a user invokes `/sprint-zero <url>`, the orchestrator adds:

4. `docs/scope.md` (once scoping is complete)
5. `docs/prd.md`
6. `docs/api-contract.md`
7. `docs/decisions.md`

When a user invokes `/sprint-zero-refine`, the orchestrator reads the build's `docs/scope.md`, its `docs/build-notes.md` if there is one, the issues already in `docs/issues/`, and then `docs/user-stories.md` and `docs/api-contract.md` to choose each track.

---

## Rules for all agents

1. **The API contract is law.** `docs/api-contract.md` is the shared interface. Backend implements it. Frontend consumes it. QA validates against it. If it's wrong or missing, stop and flag it — do not work around it silently.
2. **Read the scope file.** `docs/scope.md` tells you which of the three levels you're building for. Calibrate your output to that level. Do not add polish above the chosen level.
3. **Keep files small and readable.** Non-developers will read this. Someone may record a Loom over it.
4. **No TypeScript unless the scope file says so.** Plain JavaScript by default.
5. **No exotic dependencies.** If it needs its own README to install, pick something simpler.
6. **Seed data must be realistic.** Real-sounding names, companies, and records. Not "Test User 1".
7. **Every endpoint returns consistent JSON.** Structure defined in `docs/api-contract.md`.
8. **Log decisions.** If you make a tradeoff, add a line to `docs/decisions.md`.
9. **Narrate handoffs.** Orchestrator and engineers: never go silent for long stretches. The user is watching.
10. **Do less when in doubt.** A working 80% at the chosen scope beats a broken 100%.

---

## Conventions

- Sentence case for headings in markdown, not Title Case.
- No emoji in technical output.
- Prose over bullet lists unless structure genuinely helps.
- Numbered steps when sequence matters; otherwise prose.
- One idea per paragraph.

---

## Context for Claude Code

- Builder: Yousuf Alvi (co-facilitator on Hamza Farooq's Claude Code for PMs cohort)
- Audience for this repo: developers, founders, and PMs using Claude Code
- This repo's own build is tracked in `plan.md`, phase by phase. Each phase is a single chat session. Do not skip ahead.
- Mini Twenty is Sprint Zero's worked example (Phase 5). Until then, `examples/` is intentionally empty.

---

## Build orchestration pattern

Sprint Zero uses a two-tier pattern that respects Claude Code's sub-agent limitations:

- `tech-lead` is a **briefing sub-agent** — reads specs, returns a build brief, does NOT spawn engineers
- The **main Claude Code session** is the orchestrator — spawns backend-engineer and frontend-engineer in parallel, then qa-engineer after both complete
- `backend-engineer`, `frontend-engineer`, `qa-engineer` are **worker sub-agents** — isolated context, no sub-agent spawning themselves

When running a build, invoke tech-lead first for the brief, then follow the recommended execution order it returns.

A refinement batch keeps the same two tiers but skips tech-lead: the approved issues are the brief, and the main session spawns only the engineers whose area is touched, then qa-engineer. See "Refinement" above.

---

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
