# Granola Clone — PRD

_Built with Sprint Zero. Reference: Granola. Level: MVP._

## 1. Problem statement

People in back-to-back meetings face a bad trade-off. They can take careful notes and stop listening, or listen properly and end up with scraps like "pricing pushback" and "send deck Fri" that mean little a day later. Bot-based notetakers solve this by handing back a long transcript, but nobody reads transcripts. What's missing is a tool that starts from the few notes the person actually wrote, which signal what mattered to them, and fills in the rest from what was said. AI is now good enough to do that merge reliably, and this build shows that the loop works end to end.

## 2. Goals

- Enable a signed-in user to go from a blank note to enhanced, structured meeting notes in under 60 seconds once they have their rough notes and transcript.
- Ensure 100% of enhanced notes keep the user's original rough notes intact and viewable alongside the enhanced version.
- Enable a returning user to find and reopen any past meeting note from their notes list in under 10 seconds.
- Ensure every user sees only their own notes. No note is ever visible to another account.

## 3. Non-goals

The scope file specifies no excludes. The following parts of the reference are out of scope for this MVP:

- Live audio capture and real-time transcription. Users paste or upload a text transcript instead.
- Speaker tagging, calendar sync, and pre-meeting briefs.
- Per-note and cross-meeting AI chat, recipes, and quick actions such as follow-up emails or project plans.
- Folders, shared folders, link sharing, and team workspaces.
- Integrations (Slack, Notion, HubSpot, Zapier, Salesforce), the MCP connector, and the public API.
- Google sign-in, SSO, admin controls, consent messaging, and retention settings.
- Mobile apps, voice typing, multi-language support, and paid tiers or history limits.

## 4. Users & use cases

Priya is a product manager with six calls a day. During a customer interview she types five short lines into a new note titled "Acme discovery call". Afterwards she pastes the transcript from her video tool, picks the "Customer discovery" template, and clicks Enhance. Within seconds she has a structured summary with the customer's pain points, quotes, and next steps. Her own five lines are still there, one click away.

Marcus is a founder who meets investors back to back. On Friday afternoon he opens his notes list, sees the week's meetings in date order, and reopens Tuesday's call with Northwind Ventures to check what he promised to send. The enhanced notes list it under "Next steps".

Dana runs weekly one-to-ones. She keeps notes for each one and edits the enhanced version to correct a name the transcript got wrong. When she comes back next week, the edit is still there.

## 5. User stories

### Must-have

- As a new user, I want to sign up with email and password so that I can access the product.
- As a returning user, I want to log in so that I can see my own data.
- As a signed-in user, I want my session to persist across reloads so that I don't have to log in every time.
- As a signed-in user, I want to log out so that my session ends.
- As a signed-in user, I want to create a new meeting note with a title so that I have a place to capture a meeting.
- As a signed-in user, I want to type rough notes into the meeting note so that I can capture what matters to me during the call.
- As a signed-in user, I want to paste a transcript into the note or upload one as a text file so that the AI knows what was actually said.
- As a signed-in user, I want to click Enhance and get structured notes built from my rough notes and the transcript so that I end up with useful meeting notes without having to write them.
- As a signed-in user, I want to switch between "My notes" and "Enhanced" so that I can see what I wrote and what was added.
- As a signed-in user, I want to see a list of my past meeting notes, newest first, and open any of them so that I can revisit what happened.

### Should-have

- As a signed-in user, I want to pick a template (General meeting, 1:1, Customer discovery, Stand-up) before enhancing so that the output fits the kind of meeting.
- As a signed-in user, I want to edit the enhanced notes and save my changes so that I can fix mistakes.
- As a signed-in user, I want to re-run Enhance after changing my notes or transcript so that the output stays up to date.
- As a signed-in user, I want to delete a meeting note so that my list stays tidy.

### Nice-to-have

- As a user, I want live transcription of my computer audio so that I don't have to paste transcripts.
- As a user, I want to chat with one or all of my meetings so that I can ask what I promised this week.
- As a user, I want quick actions such as "Write follow-up email" so that I can act on a meeting fast.
- As a user, I want to share a note by link so that colleagues can read it without an account.
- As a user, I want calendar sync and pre-meeting briefs so that I'm prepared before each call.
- As a user, I want to search my notes and organise them in folders.

## 6. Acceptance criteria

**Sign up.** Given a visitor on the signup page, when they submit a new email and a password of at least 8 characters, then an account is created, they are signed in, and they land on their notes list. Given the email is already registered, when they submit, then they see an error message and no second account is created.

**Log in.** Given an existing account, when the user submits the correct email and password, then they are signed in and see their notes list containing only their own notes. Given a wrong password, when they submit, then they see an "Invalid email or password" message and stay on the login page.

**Session persistence.** Given a signed-in user, when they reload the page or open the app in a new tab, then they are still signed in and see their notes list without logging in again.

**Log out.** Given a signed-in user, when they click Log out, then their session ends and they are sent to the login page. Given they then visit the notes list URL directly, then they are redirected to login, and the server rejects any request for notes data as unauthorised.

**Create a meeting note.** Given a signed-in user on the notes list, when they click "New note" and enter a title, then a note is saved with that title and the current date and time, and it opens in the editor. Given they reload, then the note still exists in their list.

**Type rough notes.** Given an open note, when the user types rough notes and saves (or the note autosaves), then the text is stored. Given they reload, then the same rough notes appear.

**Add a transcript.** Given an open note, when the user pastes transcript text into the transcript field, or uploads a .txt file whose contents fill that field, and saves, then the transcript is stored with the note and appears after reload.

**Enhance.** Given a note with a title and at least some rough notes or a transcript, when the user clicks Enhance, then within 30 seconds the app shows structured enhanced notes with a summary, key points sections, and a "Next steps" list, and the result is saved to the note. Given a note with neither rough notes nor transcript, then the Enhance button is disabled. The original rough notes and transcript are never modified by enhancement.

**My notes / Enhanced toggle.** Given a note that has been enhanced, when the user switches to "My notes", then they see exactly their original rough notes, and when they switch to "Enhanced", then they see the enhanced notes. Given a note that has not been enhanced, then only "My notes" is available.

**Notes list.** Given a signed-in user with several notes, when they open the notes list, then they see only their own notes, newest first, each showing its title, date, and whether it has been enhanced. When they click one, then it opens with its rough notes, transcript, and enhanced notes as last saved.

## 7. Risks & assumptions

**Risks**

- Output quality depends on the LLM. Without an API key the deterministic fallback produces structured but plainer notes, which may underwhelm in a demo. The build should make clear which mode is active.
- If an LLM key is configured, calls can be slow or fail. The MVP shows a simple error and leaves the original notes untouched.
- Very long transcripts may exceed the LLM's input limits. The MVP truncates them to a fixed size.
- Data is stored in a local SQLite file, which suits a single-machine demo but not multi-device use.

**Assumptions**

- [ASSUMPTION] Transcripts come in as pasted text or an uploaded .txt file. There is no audio processing.
- [ASSUMPTION] Enhancement uses an LLM when an API key is present in the environment, and otherwise falls back to a local rule-based enhancer so the app runs with zero setup.
- [ASSUMPTION] Auth is email and password only, with no email verification and no password reset.
- [ASSUMPTION] Templates are a fixed built-in set. Users cannot create custom templates in this build.

## 8. Open questions

- Which LLM provider should the enhancer use when a key is present? The default is Anthropic Claude, with the local fallback otherwise.
- Should Enhance overwrite manual edits to the enhanced notes, or warn first? The default is to overwrite after a confirm prompt.

## 9. Success metrics

- **Leading:** the share of created notes that get enhanced at least once within the same session. The target for the demo is above 70%.
- **Leading:** the median time from clicking Enhance to the result appearing. The target is under 10 seconds.
- **Lagging:** the share of users who return and open a past note within 7 days of creating it.
- **Lagging:** the share of enhanced notes that users edit afterwards. A low rate means the enhancement is good enough to use as is.
