# Reference brief — Loom

**Company URL:** https://www.loom.com
**Repo URL:** not provided
**Language(s):** n/a

---

## What it does

Loom is an asynchronous video messaging tool, now part of Atlassian. A person records their screen, their camera, or both, with voice, and Loom turns the recording into a link they can send instead of holding a meeting. It is used by sales, engineering, support, design, and marketing teams for demos, bug reports, walkthroughs, and updates. Loom's own pages cite around 400,000 companies as customers.

## Core user flow

This is the Chrome extension flow, which is the closest match to a browser-based recorder.

1. The user signs in and opens the recorder.
2. They choose a capture mode (screen only, or screen and camera), choose a microphone, and optionally adjust the camera bubble and its background.
3. They click Start recording. The browser asks which screen, window, or tab to share, then Loom shows a 3, 2, 1 countdown.
4. While recording, a small control bar shows the elapsed time with pause, resume, and stop buttons. The camera appears as a round bubble over the screen.
5. They click stop. Loom uploads the video to its cloud, copies a share link to the clipboard, and opens the video page.
6. The video sits in the user's library, where it can be played, renamed, downloaded, shared, or deleted.

## How it works (high level)

- Recording happens on the user's device through a desktop app, a Chrome extension, or a mobile app. The browser version relies on the browser's screen capture, camera, and microphone permissions.
- Video is uploaded to Loom's cloud as it is recorded, which is why a share link is ready the moment the user stops.
- Everything after recording (library, playback, comments, editing, analytics) is a hosted web app built around the video page.
- Features are split by client. The Chrome extension covers the basics, while drawing tools and higher resolutions need the desktop app.

## Feature inventory

| Feature | What it does |
|---------|--------------|
| Screen-only recording | Captures a whole screen, a single window, or a browser tab. |
| Screen and camera recording | Captures the screen with the webcam shown on top as a round "cam bubble". |
| Camera-only recording | Records just the webcam, full frame. |
| Custom capture area | Records a user-drawn region of the screen (desktop app). |
| Microphone selection and mute | Picks which microphone to use, or records with no microphone. |
| System audio capture | Records the computer's own sound alongside the microphone. |
| Cam bubble controls | Moves the bubble and resizes it (five sizes); frames and filters can be added. |
| Virtual camera background | Replaces the background behind the person with a preset image, a colour, or an uploaded image. Only in screen and camera mode. |
| Camera background blur | Blurs the real background behind the person. |
| Blur sensitive content | Blurs chosen parts of a web page during recording (Chrome extension). |
| Recording countdown | Shows 3, 2, 1 before recording starts. Can be turned off in settings. |
| Recording control bar | Shows elapsed time and holds the pause, resume, stop, restart, and cancel buttons. |
| Pause and resume | Pauses the recording and continues it in the same video. |
| Restart and cancel | Throws away the current take and starts again, or abandons it. |
| Drawing tools and mouse highlight | Draws on screen and emphasises clicks while recording (desktop app). |
| Keyboard shortcuts | Starts, pauses, and stops recording from the keyboard. |
| Recording quality options | 720p on the free plan; HD and up to 4K on paid plans. |
| Recording limits | Free plan caps recording length and the number of stored videos. |
| Cloud upload and instant share link | Uploads on stop and copies a link anyone can open. |
| Video library | Lists all of the user's videos with thumbnails, titles, durations, and dates. |
| Folders and search | Organises videos into folders and finds them by title or transcript. |
| Video page and player | Plays a video in the browser with speed control. |
| Rename and describe | Edits a video's title and description. |
| Download | Saves the video as a file. |
| Delete and archive | Removes a video or moves it out of the main library. |
| Upload existing video | Adds a video file that was not recorded in Loom. |
| Trim and stitch | Cuts out parts of a video and joins several videos together. |
| Editor overlays | Adds text, arrows, boxes, and backgrounds after recording. |
| Custom thumbnail | Sets the image shown before the video plays. |
| Transcripts and captions | Generates a transcript and closed captions in 50+ languages. |
| AI titles, summaries, and chapters | Writes a title, summary, and chapter markers automatically. |
| AI filler-word and silence removal | Cuts "ums" and long pauses in one click. |
| AI workflows | Turns a video into a written document such as an SOP or a Jira ticket. |
| Record for agent and MCP tools | Packages screen, clicks, and URLs into a prompt for AI agents. |
| Comments | Viewers leave time-stamped comments on a video. |
| Emoji reactions | Viewers react at moments in the video. |
| Calls to action, tasks, and links | Adds a button, tasks, or external links to a video. |
| Privacy controls | Sets who can view, comment on, or download a video; password protection. |
| Embedding | Places a video inside another website or tool. |
| Viewer insights | Shows who watched and how much of the video they watched. |
| Workspaces and teams | Shared libraries, member roles, and admin controls. |
| Integrations | Slack, Google Workspace, Jira, Confluence, Salesforce, Figma, and others. |
| Enterprise security | SSO, SCIM, and custom data retention policies. |
| Plans and billing | Starter (free), Business, Business + AI, and Enterprise. |
| Desktop app | Full-featured recorder for Mac and Windows. |
| Chrome extension | Lighter recorder that lives in the browser toolbar. |
| Mobile apps | iOS and Android recording and viewing. |
| Recording SDK | Lets other products embed the Loom recorder. |

## Data model (if repo provided)

No repo was provided.

## Key files and folders (if repo provided)

No repo was provided.

## Who it's for

The person setting it up is an individual or a team admin who wants to replace meetings and long written explanations with quick videos. The end user is anyone who records a walkthrough, and the colleagues or customers who watch it.

## Things worth flagging

- Loom's whole value proposition is the cloud share link. This build deliberately removes it, so the result is a recorder and a personal library rather than a messaging tool. That is a positioning change, not just a scope cut.
- Loom's recorder is a browser extension or a desktop app, which is how its controls and cam bubble float over other windows. A plain web page cannot draw over other apps, so the camera bubble has to be composited into the video itself and the timer overlay lives in the recorder tab.
- Background blur and virtual backgrounds need person segmentation, which is a machine-learning model running on the camera feed. It is the heaviest single dependency in this build and must be bundled locally rather than fetched from a CDN.
- Browser recordings are WebM files, and their duration metadata is often missing, so the duration should be measured by the recorder rather than read from the file. WebM playback also varies by browser, with Chrome-based browsers the safe target.
- Loom has extensive AI features (titles, summaries, chapters, filler-word removal, document workflows, and agent tooling). All of it sits after upload and none of it is needed for the recording loop.

## Sources

- https://www.loom.com
- https://www.loom.com/screen-recorder
- https://support.atlassian.com/loom/docs/configure-your-recording-settings-chrome-extension/
- https://support.atlassian.com/loom/docs/add-a-virtual-background-to-your-camera-bubble/
- https://support.atlassian.com/loom/docs/pause-and-resume-while-recording/
- https://support.atlassian.com/loom/docs/choose-your-recording-mode/
- https://support.atlassian.com/loom/docs/available-loom-plans/
