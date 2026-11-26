# Loom clone — PRD

_Built with Sprint Zero. Reference: Loom. Level: MVP._

## 1. Problem statement

People who want to record a quick walkthrough of their screen are pushed towards tools that upload every recording to someone else's cloud. That is a problem for anyone recording sensitive material (internal dashboards, customer data, unreleased work) or anyone who simply wants a video file without creating a hosted account. This product is a screen recorder that runs in the browser and feels like Loom's recorder, but keeps every recording on the user's own machine.

## 2. Goals

- Enable a signed-in user to go from opening the recorder to a recording in progress in under 30 seconds, including the 3-second countdown.
- Enable a user to record in either of two modes (screen only, or screen with a round camera bubble) with the microphone on or off.
- Enable a user to hide their real surroundings with a blurred or custom-image camera background before recording starts.
- Enable a user to find a finished recording in their library within 5 seconds of pressing stop, and to play, rename, download, or delete it from there.
- Keep 100% of recordings on the local machine, with no request leaving the computer at any point.

## 3. Non-goals

From the scope excludes:

- Sharing, comments, reactions, and view analytics.
- Video editing or trimming.
- Transcripts and AI summaries.
- Teams, workspaces, and billing.
- Desktop app or browser extension; this is a web app only.

Also out of scope at this level, although Loom offers them:

- Cloud storage, share links, embedding, and privacy settings. Nothing is uploaded anywhere.
- Camera-only recording, custom capture areas, and system audio as a separate option.
- Drawing tools, mouse highlighting, and blurring parts of the screen.
- Folders, search, thumbnails, and archiving in the library.
- Controls that float over other applications. A web page cannot draw outside its own tab.
- Mobile support and integrations with other tools.

## 4. Users & use cases

Dana is a product manager who wants to show an engineer a bug in an internal admin tool. She opens the recorder, picks "Screen only", leaves the microphone on, and presses Start. After the countdown she reproduces the bug while talking through it, presses Stop, and downloads the file from her library to attach to a ticket. The recording never touched a third-party server.

Marcus is a founder recording a product walkthrough from his kitchen table. He picks "Screen + camera", sees himself in a round bubble, and switches the camera background to Blur so the kitchen disappears. Halfway through he pauses to find the right tab, resumes, and finishes. In the library he renames the recording from its default title to "Onboarding walkthrough v2".

Aiko records several short clips a week and keeps only the good ones. She opens her library, plays the latest take to check it, deletes two older attempts, and logs out. When she comes back the next day and logs in, her remaining recordings are still there.

## 5. User stories

### Must-have

Accounts:

1. As a new user, I want to sign up with email and password so that I can access the product.
2. As a returning user, I want to log in so that I can see my own recordings.
3. As a signed-in user, I want my session to persist across reloads so that I don't have to log in every time.
4. As a signed-in user, I want to log out so that my session ends.

Recording setup:

5. As a signed-in user, I want to choose between "Screen only" and "Screen + camera" so that I can decide whether my face appears in the recording.
6. As a signed-in user, I want to turn the microphone on or off before recording so that I control whether my voice is captured.
7. As a user recording with the camera, I want to choose a camera background (none, blur, or my own image) so that I can hide my surroundings.

Recording:

8. As a signed-in user, I want a 3-second countdown before recording starts so that I have a moment to get ready.
9. As a user who is recording, I want to see the elapsed time so that I know how long I have been recording.
10. As a user who is recording, I want to pause and resume so that I can skip parts I don't want in the video.
11. As a user who is recording, I want to stop and have the recording saved automatically so that it appears in my library without extra steps.

Library:

12. As a signed-in user, I want to see a library of my recordings with title, duration, and creation date so that I can find a recording.
13. As a signed-in user, I want to play a recording from my library so that I can review it.
14. As a signed-in user, I want to rename a recording so that its title means something to me.
15. As a signed-in user, I want to download a recording as a video file so that I can use it outside the app.
16. As a signed-in user, I want to delete a recording so that I can clear out takes I don't need.

### Should-have

17. As a user setting up a camera recording, I want a live preview of my camera bubble and chosen background so that I can check how I look before I start.
18. As a user recording with the camera, I want to choose which corner the bubble sits in so that it doesn't cover what I'm showing.
19. As a user who is recording, I want to cancel and discard the current take so that a bad recording doesn't end up in my library.
20. As a user who denied a browser permission, I want a clear message telling me what to allow so that I can fix it and try again.
21. As a returning user, I want the recorder to remember my last mode, microphone, and background choices so that I don't set them up every time.

### Nice-to-have

- As a user, I want to record the camera only so that I can make a talking-head video.
- As a user, I want to include the computer's own sound so that viewers hear what I hear.
- As a user, I want to resize the camera bubble so that it suits what I'm presenting.
- As a user, I want recording controls that float above other windows so that I can pause without returning to the recorder tab.
- As a user, I want keyboard shortcuts for start, pause, and stop so that I don't have to click.
- As a user, I want thumbnails and search in my library so that I can find a recording quickly.
- As a user, I want to download recordings as MP4 so that they play in every video player.

## 6. Acceptance criteria

**1. Sign up**

- Given a visitor on the sign-up page, when they submit a valid email and a password of at least 8 characters, then an account is created, they are signed in, and they land on their library.
- Given an email that already has an account, when it is submitted on the sign-up page, then a message says the email is already registered and no second account is created.

**2. Log in**

- Given a user with an account, when they submit the correct email and password, then they land on their library and see only their own recordings.
- Given a wrong password, when the form is submitted, then a message says the email or password is incorrect and they stay on the login page.

**3. Session persistence**

- Given a signed-in user, when they reload the page or close and reopen the tab, then they are still signed in and see the same page.
- Given a visitor who is not signed in, when they open the library or recorder address directly, then they are sent to the login page.

**4. Log out**

- Given a signed-in user, when they click "Log out", then they are sent to the login page and can no longer open the library or recorder without logging in again.

**5. Choose a recording mode**

- Given a signed-in user on the recorder, when the page opens, then "Screen only" and "Screen + camera" are offered and one is selected.
- Given "Screen + camera" is selected, when the user starts a recording, then the finished video shows the screen with the camera as a round bubble on top.
- Given "Screen only" is selected, when the user starts a recording, then the camera is never switched on and no bubble appears in the video.

**6. Microphone on or off**

- Given the microphone toggle is on, when a recording is made, then the finished video contains the user's voice.
- Given the microphone toggle is off, when a recording is made, then the finished video is silent and the browser never asks for microphone access.

**7. Camera background**

- Given "Screen + camera" is selected, when the user looks at the camera background options, then "None", "Blur", and "Custom image" are offered, with "None" selected by default.
- Given "Blur" is selected, when a recording is made, then the person in the bubble is sharp and everything behind them is blurred.
- Given "Custom image" is selected and the user has chosen an image file from their computer, when a recording is made, then that image appears behind the person in the bubble.
- Given "Screen only" is selected, when the user looks at the recorder, then the camera background options are hidden or disabled.

**8. Countdown**

- Given the user clicks "Start recording" and picks what to share in the browser's prompt, when the prompt closes, then the numbers 3, 2, 1 are shown one second apart and recording begins after 1.
- Given the countdown is showing, when it is in progress, then nothing from the countdown period is included in the finished video.

**9. Elapsed time**

- Given a recording is in progress, when the user looks at the recorder, then a small overlay shows the elapsed time as mm:ss, updating every second from 00:00.

**10. Pause and resume**

- Given a recording is in progress, when the user clicks "Pause", then the timer stops, the overlay shows the recording is paused, and the button changes to "Resume".
- Given a recording is paused, when the user clicks "Resume", then the timer continues from where it stopped and the paused period is not in the finished video.

**11. Stop and save**

- Given a recording is in progress or paused, when the user clicks "Stop", then the recording is saved to the local machine and the user is taken to the library, where it is the first item.
- Given a recording has just been saved, when it appears in the library, then it has a default title containing the date and time, a duration matching the timer, and today's creation date.
- Given a recording is in progress, when the user ends sharing with the browser's own "Stop sharing" button, then the recording is saved exactly as if they had clicked "Stop".
- Given a recording has been saved, when the app is restarted, then the recording is still in the library and still plays.

**12. Library**

- Given a signed-in user with recordings, when they open the library, then every one of their recordings is listed newest first with its title, duration (mm:ss), and creation date.
- Given a signed-in user with no recordings, when they open the library, then a message says there are no recordings yet and a button leads to the recorder.
- Given two different users, when each opens their library, then neither sees the other's recordings.

**13. Play**

- Given a recording in the library, when the user clicks it, then a page opens with a video player that plays the recording with sound and lets them seek.

**14. Rename**

- Given a recording, when the user edits its title and saves, then the new title shows immediately and is still there after a reload.
- Given the user clears the title, when they try to save, then the save is refused and the old title is kept.

**15. Download**

- Given a recording, when the user clicks "Download", then the browser saves a video file named after the recording's title.

**16. Delete**

- Given a recording, when the user clicks "Delete" and confirms, then it disappears from the library, and both its entry and its video file are removed from the machine.
- Given the confirmation is showing, when the user cancels, then nothing is deleted.

## 7. Risks & assumptions

**Risks**

- Screen capture only works in desktop browsers, and the recording format (WebM) plays most reliably in Chrome-based browsers. Safari may refuse to play or record. The build targets desktop Chrome and Edge.
- When the user switches to another window to record it, the recorder tab moves to the background and the browser slows down its drawing. The camera bubble is drawn by that tab, so it can freeze or stutter unless the drawing is driven by a background-safe timer. This is the main technical risk in the build.
- Blur and custom backgrounds depend on a person-detection model running live on the camera feed. It adds a large dependency, needs a reasonably fast machine, and must be bundled with the app rather than fetched from the internet.
- Long recordings are held in the browser's memory until the user stops, then sent to the local server in one go. Very long recordings (roughly over an hour) could exhaust memory.
- Automated browser tests cannot click through the browser's real screen-picker prompt. QA will need to launch the browser with fake capture devices, or verify the save step through the API.
- The timer overlay and pause button live in the recorder tab. A user recording another window has to return to that tab to pause or stop, or use the browser's own "Stop sharing" bar.

**Assumptions**

- `[ASSUMPTION]` Accounts exist even though the product is local-first, because the MVP level requires real sign-up and login. Each user sees only their own recordings.
- `[ASSUMPTION]` "Saved on the local machine" means the local Express server writes video files to a folder beside its SQLite database, which holds each recording's title, duration, and creation date.
- `[ASSUMPTION]` The camera bubble is baked into the video at a fixed size in the bottom-left corner unless the user picks another corner.
- `[ASSUMPTION]` The custom background image is used in the browser only and is never stored on the server.
- `[ASSUMPTION]` A recording that includes whatever the user shares (a tab, a window, or a whole screen) counts as "screen", and the browser's own picker is the way the user chooses.

## 8. Open questions

- Should recordings be offered as MP4 as well as WebM? WebM is what browsers produce without extra software; converting would add a heavy dependency. Not blocking: the build ships WebM.
- Should there be a maximum recording length to protect memory? Not blocking: the build sets no limit and logs the risk.

## 9. Success metrics

**Leading indicators**

- Share of started recordings that reach the library (target: above 95%).
- Time from pressing Stop to the recording being playable in the library (target: under 5 seconds for a 2-minute recording).

**Lagging indicators**

- Number of recordings a user keeps in their library after two weeks.
- Share of users who return to record again within 7 days.
