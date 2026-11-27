# Decisions

_Sprint Zero build compared to Loom. Level: MVP._

## Why this document exists

We built a screen recorder that runs in the browser and keeps every recording on the user's own machine. We compared it against Loom, which is a much larger product: a recorder, a cloud video host, a collaboration layer, and a set of AI tools. This document lists what we left out or simplified and why. Almost every cut follows from one of two things: the core loop is "record, then manage the recording in a local library", and the scope says nothing is uploaded and no third-party service is used.

## Scope decisions

### No cloud upload or share links

- **Reference does:** Uploads each video as it records and hands the user a link the moment they stop.
- **We chose to:** Save the video file on the local machine and list it in a local library.
- **Reason:** The scope states "no cloud storage, no share links, no third-party services". This is the defining difference from Loom, not a shortcut.

### No comments, reactions, or viewer insights

- **Reference does:** Lets viewers comment and react at moments in the video, and shows the owner who watched.
- **We chose to:** Leave all of it out.
- **Reason:** Explicitly excluded in the scope. With no share links there are no viewers to comment or be counted.

### No calls to action, embedding, or privacy settings

- **Reference does:** Adds buttons and links to a video, embeds it in other sites, and controls who can view or download it.
- **We chose to:** Leave all of it out.
- **Reason:** These only make sense for a shared video, and sharing is excluded in the scope.

### No editing

- **Reference does:** Trims and stitches videos, adds text, arrows and boxes, and sets a custom thumbnail.
- **We chose to:** Keep recordings exactly as recorded. Pause and resume is the only way to skip something.
- **Reason:** Video editing and trimming are explicitly excluded in the scope.

### No transcripts or AI features

- **Reference does:** Generates transcripts and captions, writes titles, summaries and chapters, removes filler words, turns videos into documents, and packages recordings for AI agents.
- **We chose to:** Leave all of it out. Titles default to the date and time and are renamed by hand.
- **Reason:** Transcripts and AI summaries are explicitly excluded in the scope, and they would need a third-party service.

### No teams, workspaces, plans, or enterprise controls

- **Reference does:** Offers shared team libraries, member roles, four pricing plans, single sign-on, and data retention policies.
- **We chose to:** Give each person their own account and their own private library, with no limits and no billing.
- **Reason:** Teams, workspaces, and billing are explicitly excluded in the scope.

### Web app only

- **Reference does:** Ships a desktop app, a Chrome extension, mobile apps, and a kit for embedding its recorder in other products.
- **We chose to:** Build a single web app for desktop browsers.
- **Reason:** A desktop app or browser extension is explicitly excluded in the scope.

### Controls stay in the recorder tab

- **Reference does:** Floats its control bar and camera bubble above every other window.
- **We chose to:** Show the timer, pause, resume, and stop controls inside the recorder tab, and treat the browser's own "Stop sharing" button as a stop.
- **Reason:** Only a desktop app or extension can draw over other windows, and both are excluded. The core loop still works end-to-end.

### Camera bubble is baked into the video at a fixed size

- **Reference does:** Lets the user drag the bubble anywhere, pick from five sizes, and add frames and filters.
- **We chose to:** Draw the bubble into the video at one size, in a corner. Choosing the corner is a should-have.
- **Reason:** The core loop needs a round bubble over the screen, nothing more. Free dragging and resizing are polish above MVP.

### Camera backgrounds limited to none, blur, and one custom image

- **Reference does:** Offers preset background images, solid colours, uploaded images, and blur.
- **We chose to:** Offer exactly the three options in the scope. The custom image is used in the browser and not stored.
- **Reason:** The scope lists these three options. Presets and colours add nothing to the core loop.

### Two recording modes instead of three

- **Reference does:** Records screen only, screen and camera, or camera only, and can capture a hand-drawn region.
- **We chose to:** Offer screen only and screen plus camera. The user picks a tab, window, or whole screen in the browser's own prompt.
- **Reason:** The scope names these two modes. Camera-only and custom regions are outside the core loop.

### Microphone only, with a simple on/off switch

- **Reference does:** Lets the user pick between microphones and record the computer's own sound.
- **We chose to:** Use the default microphone with an on/off switch. Computer sound is not offered as an option.
- **Reason:** The scope asks for microphone audio that can be turned off. Device pickers and system sound are beyond the core loop at MVP.

### Countdown is always on

- **Reference does:** Shows a 3, 2, 1 countdown that can be switched off in settings.
- **We chose to:** Always show the countdown.
- **Reason:** The scope asks for a countdown and does not ask for a settings screen.

### No drawing, mouse highlight, or screen blur tools

- **Reference does:** Lets the user draw on screen, highlights clicks, and blurs sensitive parts of a page.
- **We chose to:** Leave them out.
- **Reason:** Not part of the core loop, and most need the desktop app or extension that the scope excludes.

### No restart, and cancel is a should-have

- **Reference does:** Offers restart and cancel buttons while recording.
- **We chose to:** Offer cancel as a should-have and skip restart. A bad take can always be deleted from the library.
- **Reason:** The core loop names pause, resume, and stop. Delete already covers the need at MVP.

### A flat library

- **Reference does:** Organises videos in folders with thumbnails, search, and an archive.
- **We chose to:** Show one list, newest first, with title, duration, and creation date.
- **Reason:** The scope names exactly those three details. A personal local library is small enough not to need folders or search at MVP.

### No uploading of existing videos

- **Reference does:** Accepts video files that were not recorded in Loom.
- **We chose to:** Only store recordings made in the app.
- **Reason:** The core loop begins with recording. Importing is a separate flow.

### One quality level, WebM format

_The "one quality level" part was reversed in refinement batch 3: see "Refinement batch 3" below. The WebM part was reversed in refinement batch 4: see "Refinement batch 4" below._

- **Reference does:** Records at 720p on the free plan and up to 4K on paid plans, and delivers widely playable video.
- **We chose to:** Record at whatever resolution the browser captures and save it as a WebM file.
- **Reason:** WebM is what browsers produce with no extra software. Converting to MP4 would add a heavy dependency, which rule 5 of this kit advises against.

### No keyboard shortcuts or integrations

- **Reference does:** Starts and stops from the keyboard and connects to Slack, Jira, Google Workspace, and others.
- **We chose to:** Leave both out.
- **Reason:** Shortcuts are polish above MVP, and integrations are third-party services, which the scope rules out.

## Technical decisions

### Stack: node-react with the local data layer

- **We chose:** A React (Vite) frontend and an Express backend, with accounts and recording details in a local SQLite database, login handled by the backend itself, and video files written to a folder on the same machine.
- **Reason:** The scope picked the local data layer, so the app runs straight after clone with no account or keys. It also happens to be the only data layer consistent with "nothing is uploaded".

### Project type: web-app

- **We chose:** A web app with a UI and an API.
- **Reason:** Recording needs the browser's screen, camera, and microphone access, and the library needs somewhere to keep files, so both halves are required.

### Recording happens entirely in the browser

- **We chose:** The browser captures the screen and camera, draws the camera bubble onto the picture, and produces the finished file. The server only stores and serves files.
- **Reason:** Keeps the server small and avoids any video-processing software on the machine. The cost is that the recorder tab must keep drawing while it is in the background, which is logged as the main risk in the PRD.

### Person detection is bundled with the app

- **We chose:** The model that separates the person from their background for blur and custom images is installed as a local dependency and served by the app.
- **Reason:** The scope rules out third-party services, so nothing may be fetched from the internet while the app runs.

### Video playback and download use a link that carries the login token

- **We chose:** The video player and download button load the file from an address that includes the user's session token.
- **Reason:** A browser's video player cannot attach a login header to its requests. Because everything runs on the user's own machine, this is an acceptable tradeoff at MVP.

### The recorder measures duration itself

- **We chose:** The duration stored for each recording is the recorder's own timer, not a value read from the file.
- **Reason:** Browser-made WebM files often lack duration information, and using the timer guarantees the library matches what the user saw.

### Testing: Playwright via MCP

- **We chose:** Playwright driven by the QA sub-agent through the Playwright MCP, plus API-level checks for saving, listing, renaming, downloading, and deleting.
- **Reason:** Browser-driven tests catch the real user journey, including the auth dance. An automated browser cannot click through the real screen-picker prompt, so the save step is also verified through the API with a sample video file.

### Build level: MVP

- **We chose:** MVP
- **Reason:** The goal is to show the idea works: real accounts, real files on disk, and one loop from recording to library. Error handling and validation beyond the basics are left for Prod.

## What we'd add next

1. **Floating controls.** A small always-on-top control window for timer, pause, and stop, using the browser's picture-in-picture feature. It removes the most awkward part of the current flow for little work.
2. **MP4 download.** Makes recordings playable everywhere, including Safari and most phones.
3. **Thumbnails and search in the library.** Becomes valuable as soon as a user has more than a couple of dozen recordings.
4. **Trimming the start and end.** The most-used edit by far, and it removes the need to re-record for a messy opening.
5. **Camera-only mode and bubble resizing.** Small additions that reuse everything already built for the camera.

## Rulings made at the build brief

Tech-lead found six places where the contract was silent. Each was settled before the build started.

- **Download file names.** Recording titles can contain characters that are not allowed in a plain download header (the default title has a long dash). The download sends a simplified name as a fallback alongside the real one.
- **Seed command.** The demo data is created with `node seed.js`, run from `server/`.
- **Seeded durations.** Demo recordings show the true length of their sample video rather than an invented one, so the library and the player always agree.
- **Timestamps.** Dates are stored to the second, without fractions of a second.
- **Session length.** A login lasts 7 days.
- **Camera preview is required.** Choosing a background only makes sense if the user can see the result, so the live preview (story 17) is built as part of the must-have background story (story 7).

## Decisions made while building the backend

- **Reading the video type from the file itself.** Browsers label a recording with its codec list (for example `video/webm;codecs=vp9,opus`), and the upload library cannot read a label with a comma in it. When that happens the server looks at the first bytes of the file to tell WebM from MP4, so the stored type is still `video/webm`.
- **Long titles on save are refused.** The contract says a title is at most 200 characters but only spells out the refusal for renaming. Saving a new recording with a longer title is refused the same way (400 `invalid_input`).
- **Seeking past the end of a video.** The contract has no error code for a player asking for a part of the file that does not exist. The server answers with the standard status 416 and the usual error shape, using the code `invalid_input`.
- **Re-running the seed resets only the demo account.** It restores the demo password and the three demo recordings, and leaves other accounts and their recordings alone. The demo recordings keep the same ids each time.
- **Sample video.** The demo recordings are copies of one 5-second sample clip (a test pattern with a tone) generated once with ffmpeg and kept in `server/fixtures/`. The seed itself needs no extra tools.
- **Upload limit can be lowered for testing.** Setting `MAX_UPLOAD_BYTES` before starting the server shrinks the 2 GB limit so the "file too large" response can be checked without a 2 GB file. Nothing needs to be set for normal use.

## Frontend build notes

Tradeoffs made while building the recorder and library screens.

- **No marketing landing page.** The stories make `/` the signed-in library and send signed-out visitors to `/login`, so there is no public home page. Logging out lands on `/login`.
- **Person detection library.** Blur and Custom image use the older MediaPipe selfie segmentation package because it ships its program and model files inside the npm package. A small script copies them into the app's public folder whenever the app is started or built, so nothing is downloaded while the app runs and no file had to be fetched by hand.
- **Recordings are tidied up in the browser before saving.** Browser-made video files have no length and no seek index, and in testing Chrome failed to jump around in them. After Stop, the browser rewrites the file (without re-encoding the picture or sound) so it has both, using one extra dependency, `mediabunny`. If that step fails, the original file is saved instead. The cost is a short extra wait and roughly double the memory at the moment of saving.
- **Older files without a length still play.** The player tries the usual trick to discover the length; if the browser refuses, it reloads the video and plays it without a working scrub bar until it has been played through once.
- **VP8 video.** Recordings use the VP8 format because it is lighter on the machine than VP9 while the camera effects are running. Files are somewhat larger. (Refinement batch 3 narrowed this: VP9 is now used when no camera effect is running and the quality is "720p" or "1080p".)
- **Screen + camera recordings are capped at 1920 pixels on the long edge.** Larger screens are scaled down so drawing the bubble 30 times a second stays smooth. Screen only recordings keep the screen's own size.
- **Duration is rounded down.** The saved duration is the whole seconds shown on the timer when Stop was pressed, so a 5.9 second file is listed as 00:05.
- **Camera stays on after cancelling a take.** Cancelling returns to the setup screen, where the live preview needs the camera, so only the screen and microphone are released. Stopping (saving) or choosing "Screen only" turns the camera off.
- **Slow or failed background effects fall back to None.** If the model cannot load, stops responding for 5 seconds, or averages more than a quarter of a second per frame, the background switches to None with a notice, and recording carries on.
- **Stopping during the countdown saves nothing.** Using the browser's "Stop sharing" before the countdown ends simply returns to the setup screen.
- **Settings are remembered when a recording starts,** not on every click, so merely looking at the options does not change next time's defaults.
- **Leaving the recorder page inside the app discards the take.** The browser warns before closing or reloading the tab, but clicking "Log out" or the logo mid-recording does not ask first.
- **An expired login during saving loses the take.** Any rejected login sends the user to the login page, including while a recording is being saved. Logins last 7 days, so this is rare.
- **Should-haves included:** bubble position, cancel a take, permission help messages, and remembered settings were all cheap and are built.


## Refinement batch 1

Three features added after the first build was tested by hand.

- **Camera-only recording is now in.** This reverses the earlier "Two recording modes instead of three" cut. The saved video is the camera filling the frame. A recording's mode can now be one of three values, which is the only change to the server.
- **Mirror camera.** A switch flips the camera left to right in both the preview and the saved video, so the two always match. The tradeoff is that text held up to the camera reads backwards for viewers. A custom background image is never flipped.
- **Show, dim, or hide the camera view.** This changes only what the person recording sees on the recorder page. The saved video always shows the camera normally, because a hidden camera in a camera-only video would be an empty video.
- **The dim level is fixed.** It was not specified whether the darkness should be adjustable, so there is one level. An adjustable level is an easy follow-up.
- **Camera view size in camera-only mode has three steps** (small, medium, large) and changes only the view on the page, never the saved video.

### Frontend tradeoffs in refinement batch 1

- **Camera-only video is recorded at the camera's own size, 640 by 480.** The camera is opened at that size so background effects stay fast, and camera-only reuses the same camera. A sharper camera-only picture is a follow-up that would need the effects re-tested at the larger size.
- **Camera-only records the camera directly when it can.** With "Mirror camera" off and the background set to "None", the camera is recorded as it is. With either one on, the recording is taken from the same picture the live view shows, so the two cannot differ.
- **With "Blur", the blurred room is flipped along with the person** when "Mirror camera" is on, because it is the real room behind them. Only a custom image stays the right way round.
- **"Camera view" and "Camera view size" are remembered as soon as they are changed**, because they can be changed during a recording. The other settings are still remembered when a recording starts.
- **"Camera view" and "Camera view size" sit under the camera view**, not in the setup panel, so they are in the same place before and during a recording.
- **If the camera is unplugged during a camera-only recording, the recording stops and is saved**, the same way "Stop sharing" ends a screen recording.

## Refinement batch 2

One polish item, one bug fix, and two features added after the second round of hand testing.

- **Computer audio is now in.** This reverses the "Computer sound is not offered" part of the earlier microphone decision. A "Computer audio" switch, off by default, asks the browser's share prompt for audio, and the sound is mixed with the microphone into the one soundtrack of the video.
- **Computer audio depends on what is shared.** The browser decides: a tab can share its own sound, the entire screen can share system sound on recent systems, and a single window cannot share sound at all. When no audio comes through, recording carries on and a notice says so, rather than refusing to record.
- **No computer audio in "Camera only".** Browsers only hand over computer audio as part of a screen share. Asking for one would bring back the share prompt that camera-only mode exists to avoid.
- **The sound keeps playing while it is recorded.** With speakers and the microphone both on, the microphone can pick the same sound up a second time. The browser's echo removal usually handles it; headphones avoid it entirely.
- **Floating controls are now in.** This reverses the earlier "Controls stay in the recorder tab" cut, using the browser's picture-in-picture window for web pages, which was first on the "What we'd add next" list. It shows the countdown, the timer, and "Pause" / "Resume", "Stop", and "Cancel".
- **Floating controls close by themselves when the entire screen is shared.** They are a real window on the screen, and in testing a whole-screen recording showed them. A web page cannot hide one of its windows from a capture of the entire screen, so the window is closed before recording starts and a notice explains why. They are never in the video when a tab or a single window is shared. The cost is that a whole-screen recording is again controlled from the recorder tab or the browser's "Stop sharing" button.
- **Floating controls open with "Start recording", with a button as a fallback.** Browsers only let a page open this window straight from a click. If the browser refuses, the recorder page shows "Open floating controls".
- **Shortcuts use the keyboard's media keys, not letter keys.** A web page only receives ordinary key presses while it is the focused tab, so a letter shortcut could not pause or stop from another tab or app without a browser extension, which the scope excludes. Media keys are the exception: the browser passes them to a page that is playing sound, wherever the user is. Play/Pause pauses and resumes, Next track stops and saves. This is the way to control a whole-screen recording, where floating controls cannot be used.
- **Media keys work by playing silence.** The browser only sends media keys to a page that is playing something, so the recorder plays a silent sound for the length of the take. The costs: the keys do not control a music player during a recording, there is no key for cancel (and discarding a take on one key press with no confirmation would be risky), and it relies on browser behaviour that could change. A "Media key shortcuts" switch turns it off.
- **The recorder starts a quarter of a second after the countdown ends.** Starting in the same instant put the countdown's last "1" in the first frame of the video, because the screen had not yet redrawn. The page now removes the countdown first, then starts recording. The timer and the saved duration count from the moment recording really starts.
- **"Computer audio", "Floating controls", and "Media key shortcuts" are remembered when a recording starts**, like the microphone setting.

## Refinement batch 3

One feature: better recording quality, with a choice of resolution.

- **A choice of video quality is now in.** This reverses the "one quality level" part of the earlier "One quality level, WebM format" cut. "Video quality" offers "720p", "1080p", and "Original", and starts on "1080p": sharp enough for text on most screens without the file sizes of a full high-density screen.
- **The quality names are limits, not exact sizes.** The picture is fitted inside 1280 by 720 or 1920 by 1080 with its shape kept, and is never enlarged. A screen that is not 16:9 gives a slightly smaller picture rather than black bars. "Original" stops at 4K (3840 by 2160), because larger pictures are too heavy to encode in the browser.
- **The data rate now follows the picture size.** Before, the browser was left to pick, and it spends about 2.5 Mbps whatever the size, which was the main cause of blurry text. The recorder now asks for about 2.5 Mbps at 720p, 5 Mbps at 1080p, and up to 20 Mbps at 4K, plus 128 kbps for sound. These are ceilings: a screen that is not changing uses far less. The cost is larger files for busy pictures, roughly 40 MB a minute at 1080p at worst.
- **VP9 where the machine can afford it.** This narrows the earlier "VP8 video" decision. VP9 looks better at the same size but is heavier to encode, so it is used only at "720p" and "1080p" with no camera background effect running. With "Blur" or "Custom image", and at "Original", recordings stay VP8.
- **"Camera only" follows the quality setting.** This replaces the batch 1 tradeoff that fixed camera-only video at 640 by 480. The camera is opened at 1280 by 720 for "720p" and at 1920 by 1080 for "1080p" and "Original"; a camera that cannot do that gives its nearest size. With a background effect on it stays at 1280 by 720 at most, because the effect is redrawn for every frame.
- **The camera in "Screen + camera" stays at 640 by 480.** The bubble is about a quarter of the frame's shorter side, so even at 4K it is drawn no larger than the camera picture already is. A bigger camera picture would cost speed and show nothing.
- **Switching between "Screen + camera" and "Camera only", or changing the quality in "Camera only", restarts the camera for a moment**, because it has to be reopened at a different size. The size is fixed once a recording starts.
- **The quality is not stored with the recording.** It is a recorder setting kept in the browser, like the others, so the server and the contract are unchanged.
- **Still 30 frames a second.** A higher frame rate was not asked for and would double the work of drawing the bubble.

## Refinement batch 4

One changed behaviour: new recordings are saved as MP4 in place of WebM.

- **New recordings are MP4.** This reverses the "WebM format" part of the earlier "One quality level, WebM format" cut. MP4 with H.264 video and AAC sound is what Google Drive, YouTube, QuickTime, and phones all accept, which is what the recordings are now used for. There is no format choice: one format keeps the recorder simple. The MP4 is made by the app itself, with nothing to install and nothing sent outside `localhost`, so the reason for the original cut (a heavy dependency) is still respected.
- **Recordings already in the library are not converted.** They stay WebM, still play, and still download as `.webm`. Converting them was not asked for and would mean rewriting the user's existing files. The cost is a library that can hold both formats, told apart only by the downloaded file's ending.
- **A browser that cannot make MP4 falls back to WebM.** Losing a take is worse than getting it in the older format, so the recording is saved as WebM without an error. The cost is that the fallback is silent: the user finds out from the `.webm` ending of the download.

## Refinement batch 5

One feature: a grid view with thumbnails in the library.

- **Thumbnails are now in.** This reverses the thumbnails part of the earlier "A flat library" cut, and takes the thumbnails half of "Thumbnails and search in the library" off the "What we'd add next" list. The library gains a "Grid" view next to the list; folders, search, and an archive are still out.
- **A thumbnail is read from the video, not stored as a picture.** The browser shows a still from the start of each recording, using the video file the server already serves. Nothing changes on the server or in the contract, and recordings made before this batch get a thumbnail too. The costs: the picture is whatever the recording opens on and cannot be chosen, and the grid asks the server for the start of every video on the page, which will get slower as a library grows large.
- **"List" stays the view shown first.** The grid was asked for as an addition, so the library opens as it always has until the user picks "Grid". The choice is kept in the browser, like the recorder settings, and is not stored on the server.

## Refinement batch 6

Three changes to the library: the "View" choice becomes a drop-down list, "Rename", "Download", and "Delete" become icons, and the grid cards follow a card from Loom's library.

- **"Rename", "Download", and "Delete" are icons without words.** They take far less room, which the grid cards need, and they are the same everywhere the three buttons appear, so the library and the recording page do not disagree. The cost is that an icon is less obvious than a word to someone new; the name shows when the pointer rests on it. The buttons that finish an action ("Save", "Cancel", and the confirmation's "Delete") keep their words.
- **Thumbnails are now cropped to fill their box.** This reverses the batch 5 choice to fit the picture inside the box with dark bars. It matches the reference card and makes the grid even, at the cost of cutting the edges off a recording that is not 16:9.
- **The grid shows a rounded length and an age, not the exact figures.** A card reads "4 min" and "3 years" as the reference does. The exact duration and creation date stay in the "List" view and on the recording page, and the full date shows when the pointer rests on the age.
- **The reference card's owner, sharing, and counts are left out.** Its avatar and name, "Share to Spaces", and the view, comment, and reaction counts have nothing behind them here: the scope excludes sharing, comments, reactions, and view analytics, and every recording in a library belongs to the person looking at it. The three icons take the bottom line where the counts are.
