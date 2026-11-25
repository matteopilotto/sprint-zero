# Sprint Zero — Scope

## Reference

- **Company URL:** https://www.granola.ai/
- **Repo URL:** not provided

## Build configuration

- **Project type:** web-app
- **Stack profile:** python-react
- **Data layer:** local

A React+Vite UI talking to a FastAPI backend, with data and auth stored locally in SQLite (no external account needed).

## Build level

**MVP**

Real signup/login and real persisted data, with the one core loop below working end-to-end; no polish beyond that.

## Core loop

A signed-in user creates a meeting note, types rough notes, pastes or attaches a meeting transcript, then clicks "Enhance" to get AI-enhanced structured notes that are saved alongside the original and viewable later from their notes list.

## Excludes

None specified.

## Assumptions made during scoping

- [ASSUMED] Data layer defaults to `local` (SQLite + self-issued JWT) because the answer was left blank.
- [ASSUMED] Core loop taken from the orchestrator's suggestion, which the user accepted ("as you suggested").
- [ASSUMED] Transcripts are pasted text or an uploaded text file; live audio capture and transcription are out of scope for MVP since they need a desktop app and a speech-to-text service.
- [ASSUMED] "Enhance" uses an LLM when an API key is configured, and falls back to a deterministic local enhancer otherwise, so the build still runs with zero external setup.
