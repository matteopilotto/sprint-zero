# Reference brief — Granola

**Company URL:** https://www.granola.ai/
**Repo URL:** not provided
**Language(s):** n/a

---

## What it does

Granola is an AI notepad for people who spend their day in back-to-back meetings. Instead of sending a bot into the call and handing back a long transcript, it lets you type your own rough notes while it transcribes the meeting in the background from your computer's audio. When the meeting ends, it merges your notes with the transcript to produce clean, structured notes. Your own words stay visually distinct from what the AI added, and action items and follow-ups are ready straight away. It is used by founders, PMs, salespeople, investors and researchers who want good notes without having to stop listening.

## Core user flow

1. The user opens a new note for a meeting, either from a calendar notification or by hand, and gives it a title.
2. During the meeting the user types sparse, rough notes ("pricing pushback", "send deck by Fri") while Granola transcribes the conversation in the background.
3. When the meeting ends, the user clicks "Generate notes" (enhance). Granola combines the rough notes with the transcript and produces structured notes with headings, bullets, and a "Next steps" section with owners. A template can shape the output.
4. The user toggles between "My notes" and "Enhanced" to compare, and edits the enhanced version if needed.
5. The note is saved to the user's notes list, where they can search for it, reopen it later, share it, or run quick actions such as "Write follow-up email" or "List actions".

## How it works (high level)

- A native desktop and mobile app captures system audio locally and streams it to a speech-to-text service. No bot joins the call, and audio is deleted after transcription.
- An LLM takes three inputs (the user's typed notes, the transcript, and an optional template) and returns enhanced notes. The user's text is preserved and the AI's additions are marked separately.
- Notes, transcripts and templates are stored per user in a cloud workspace, with folders and sharing on top.
- A chat layer runs retrieval over one or many notes ("What did I promise this week?"). An MCP server and an API expose notes to other AI tools.

## Feature inventory

| Feature | What it does |
|---------|--------------|
| Account and sign-in | Google OAuth sign-in. Each user's notes are private by default. |
| Notes list | Chronological list of past meeting notes, with search. |
| Rough notes editor | A plain notepad for typing during the meeting. |
| Bot-free transcription | Captures device audio and transcribes live, with no meeting bot. |
| Speaker tagging | Labels who said what in the transcript. |
| AI enhance ("Generate notes") | Merges typed notes and transcript into structured notes, keeping the user's text distinct from AI text. |
| My notes / Enhanced toggle | Switches between the raw notes and the enhanced version. |
| Note templates | Built-in (1:1, sales call, stand-up, and more) and custom templates that shape the enhanced output. Auto-picked by default. |
| Recipes | Saved, reusable chat prompts for extracting insights or drafting deliverables. |
| Ask anything (per-note chat) | Question-and-answer over a single meeting's notes and transcript. |
| Cross-meeting chat | Question-and-answer across all notes, with model selection on paid tiers. |
| Quick actions | "List actions", "Write follow-up email", "Draft project plan". |
| Follow-up emails | Generates a post-meeting email draft (paid). |
| Pre-meeting briefs | Calendar-driven summary of attendees and prior context before external meetings (paid). |
| Calendar sync | Detects upcoming meetings and prompts the user to start a note. |
| Folders and shared folders | Organises notes. Shared folders support folder-level chat. |
| Sharing | Shares a note with participants or by link, and viewers don't need an account. |
| Integrations | Slack (free), plus Notion, Zapier, HubSpot, Attio, Affinity and Salesforce (paid or enterprise). |
| MCP connector and API | Exposes notes to Claude, ChatGPT, Cursor and other tools. |
| Voice typing | Dictation in any app (a separate product). |
| Multi-language support | Transcription and notes in multiple languages. |
| Workspace dictionary | Custom vocabulary for transcription (paid). |
| Consent messaging | Notifies participants that Granola is being used. |
| Retention controls | Transcript auto-deletion and model-training opt-out. |
| Admin and enterprise | SSO, SCIM, audit API, HIPAA, usage analytics, centralised billing. |
| Mobile and watch apps | iOS, Android and Apple Watch apps for in-person meetings. |
| History limit (free) | The free tier can only work with notes from the last 30 days. |

## Who it's for

Granola is set up by an individual professional, or by a team lead rolling it out to a workspace, who installs the desktop app and connects their calendar. The end user is anyone in back-to-back meetings who wants accurate, structured notes and action items without being distracted by note-taking during the call.

## Things worth flagging

- **The LLM is the product.** Enhancement depends on an LLM that merges the user's notes with the transcript. A simplified build needs either an API key or a deterministic fallback so it still runs with no external setup.
- **Audio capture is native and heavy.** System-audio capture and live speech-to-text need a desktop app and a transcription service. A web MVP should accept a pasted or uploaded transcript instead.
- **Keeping user text distinct from AI text is a signature design choice.** Even a simplified build should keep the original rough notes and the enhanced output side by side, never overwriting one with the other.
- **Templates shape output.** A small set of built-in templates is a cheap way to make enhancement feel tailored.
- **Privacy is a selling point.** The product's positioning leans on no bot, audio deletion, consent messaging and per-user privacy. Notes should be scoped strictly per user.
