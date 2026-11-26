# User stories

_Level: MVP. Expanded from `docs/prd.md`._

Screen names and addresses used throughout: sign-up page `/signup`, login page `/login`, library `/` (the authenticated home screen), recorder `/record`, recording page `/recordings/:id`.

## Must-have

### Story 1 — Sign up

**Story:** As a new user, I want to sign up with email and password so that I can access the product.

**Acceptance criteria:**

- Given a visitor on `/signup`, when they fill the "Email" and "Password" fields with a valid email and a password of at least 8 characters and click "Sign up", then a session is created and they land on `/` with the heading "Your recordings" visible.
- Given an email that already has an account, when it is submitted on `/signup`, then the message "That email is already registered." is visible and the visitor stays on `/signup`.
- Given a visitor on `/signup`, when they look below the form, then a link "Log in" leads to `/login`.

**Priority:** Must-have
**Effort:** Small

### Story 2 — Log in

**Story:** As a returning user, I want to log in so that I can see my own recordings.

**Acceptance criteria:**

- Given a user with an account on `/login`, when they fill "Email" and "Password" correctly and click "Log in", then they land on `/` and see only their own recordings.
- Given a wrong password, when the form is submitted, then the message "Email or password is incorrect." is visible and they stay on `/login`.
- Given a visitor on `/login`, when they look below the form, then a link "Sign up" leads to `/signup`.

**Priority:** Must-have
**Effort:** Small

### Story 3 — Session persists across reload

**Story:** As a signed-in user, I want my session to persist across reloads so that I don't have to log in every time.

**Acceptance criteria:**

- Given a signed-in user on `/`, when they reload the page, then they are still on `/` and "Your recordings" is visible without logging in again.
- Given a visitor who is not signed in, when they open `/`, `/record`, or `/recordings/:id` directly, then they are redirected to `/login`.
- Given a signed-in user whose session is no longer valid, when the app next asks the server for data, then they are signed out and redirected to `/login`.

**Priority:** Must-have
**Effort:** Small

### Story 4 — Log out

**Story:** As a signed-in user, I want to log out so that my session ends.

**Acceptance criteria:**

- Given a signed-in user on any page, when they click the "Log out" button in the header, then they land on `/login`.
- Given a user who has just logged out, when they open `/` directly, then they are redirected to `/login`.

**Priority:** Must-have
**Effort:** Small

### Story 5 — Choose a recording mode

**Story:** As a signed-in user, I want to choose between "Screen only" and "Screen + camera" so that I can decide whether my face appears in the recording.

**Acceptance criteria:**

- Given a signed-in user on `/`, when they click "New recording", then they land on `/record`.
- Given a user on `/record`, when the page opens, then three options labelled "Screen only", "Screen + camera", and "Camera only" are visible and "Screen only" is selected.
- Given "Screen + camera" is selected, when a recording is made, then the saved video shows the screen with the camera as a round bubble on top, and the recording's mode is stored as screen plus camera.
- Given "Screen only" is selected, when a recording is made, then the browser never asks for camera access and the saved video has no bubble.

**Priority:** Must-have
**Effort:** Large

### Story 6 — Microphone on or off

**Story:** As a signed-in user, I want to turn the microphone on or off before recording so that I control whether my voice is captured.

**Acceptance criteria:**

- Given a user on `/record`, when the page opens, then a "Microphone" toggle is visible and switched on.
- Given the "Microphone" toggle is on, when a recording is made, then the saved video has an audio track.
- Given the "Microphone" toggle is off, when a recording is made, then the browser never asks for microphone access and the saved video has no microphone audio.

**Priority:** Must-have
**Effort:** Small

### Story 7 — Camera background

**Story:** As a user recording with the camera, I want to choose a camera background (none, blur, or my own image) so that I can hide my surroundings.

**Acceptance criteria:**

- Given "Screen + camera" is selected on `/record`, when the user looks at the "Camera background" control, then the options "None", "Blur", and "Custom image" are visible and "None" is selected.
- Given "Blur" is selected, when a recording is made, then in the bubble the person is sharp and everything behind them is blurred.
- Given "Custom image" is selected, when the user picks an image file with the "Choose image" button, then that image appears behind the person in the bubble.
- Given "Custom image" is selected and no image has been chosen yet, when the user looks at the recorder, then "Start recording" is disabled and the hint "Choose an image to use as your background." is visible.
- Given "Screen only" is selected, when the user looks at `/record`, then the "Camera background" control is not visible.

This story depends on the live camera preview described in story 17, so that preview is built as part of this story and is required.

**Priority:** Must-have
**Effort:** Large

### Story 8 — Countdown

**Story:** As a signed-in user, I want a 3-second countdown before recording starts so that I have a moment to get ready.

**Acceptance criteria:**

- Given a user on `/record`, when they click "Start recording" and choose what to share in the browser's prompt, then a countdown element shows "3", then "2", then "1", one second apart.
- Given the countdown has shown "1" for one second, when it ends, then the countdown disappears and the recording overlay appears at "00:00".
- Given the recorder page itself is visible in what is being shared, when the saved video is played, then its first frame shows the recording overlay and never the countdown. (Sharpened in refinement batch 2.)
- Given the user dismisses the browser's share prompt without choosing anything, when the prompt closes, then no countdown starts and the setup controls are still visible.

**Priority:** Must-have
**Effort:** Small

### Story 9 — Elapsed time overlay

**Story:** As a user who is recording, I want to see the elapsed time so that I know how long I have been recording.

**Acceptance criteria:**

- Given a recording is in progress, when the user looks at `/record`, then a small overlay shows a red recording dot and the elapsed time as mm:ss.
- Given a recording started 5 seconds ago, when the user looks at the overlay, then it reads "00:05".
- Given a recording is in progress, when the user looks at `/record`, then the mode, microphone, and background controls are hidden or disabled.

**Priority:** Must-have
**Effort:** Small

### Story 10 — Pause and resume

**Story:** As a user who is recording, I want to pause and resume so that I can skip parts I don't want in the video.

**Acceptance criteria:**

- Given a recording is in progress, when the user clicks "Pause", then the timer stops advancing, the overlay shows "Paused", and the button reads "Resume".
- Given a recording is paused, when the user clicks "Resume", then the timer continues from the value it stopped at and the button reads "Pause" again.
- Given a recording was paused for 10 seconds, when it is saved, then its duration does not include those 10 seconds.

**Priority:** Must-have
**Effort:** Small

### Story 11 — Stop and save

**Story:** As a user who is recording, I want to stop and have the recording saved automatically so that it appears in my library without extra steps.

**Acceptance criteria:**

- Given a recording is in progress or paused, when the user clicks "Stop", then the message "Saving recording…" appears, the recording is sent to the server, and the user lands on `/` with the new recording first in the list.
- Given a recording has just been saved, when it appears in the library, then its title is "Recording — " followed by the date and time, its duration matches the timer when Stop was clicked, and its date is today.
- Given a recording is in progress, when the user clicks the browser's own "Stop sharing" button, then the recording is saved exactly as if "Stop" had been clicked.
- Given a recording has been saved, when the server is restarted and the user logs in again, then the recording is still listed and still plays.
- Given the recording has stopped, when the user looks at the browser, then the screen-sharing, camera, and microphone indicators have all turned off.

**Priority:** Must-have
**Effort:** Medium

### Story 12 — Library

**Story:** As a signed-in user, I want to see a library of my recordings with title, duration, and creation date so that I can find a recording.

**Acceptance criteria:**

- Given a signed-in user with recordings, when they open `/`, then each recording is shown as a row or card with its title, its duration as mm:ss, and its creation date, newest first.
- Given a signed-in user with no recordings, when they open `/`, then the message "No recordings yet." and a "New recording" button are visible.
- Given two users each with recordings, when one of them opens `/`, then none of the other user's recordings are listed.

**Priority:** Must-have
**Effort:** Small

### Story 13 — Play a recording

**Story:** As a signed-in user, I want to play a recording from my library so that I can review it.

**Acceptance criteria:**

- Given a recording in the library, when the user clicks its title, then they land on `/recordings/:id` and a video player with playback controls is visible along with the title, duration, and creation date.
- Given the recording page is open, when the user presses play, then the video plays with sound and can be seeked.
- Given a user opens `/recordings/:id` for a recording that does not exist or belongs to someone else, when the page loads, then the message "Recording not found." and a link back to the library are visible.

**Priority:** Must-have
**Effort:** Medium

### Story 14 — Rename a recording

**Story:** As a signed-in user, I want to rename a recording so that its title means something to me.

**Acceptance criteria:**

- Given a recording, when the user clicks "Rename", changes the text in the "Title" field, and clicks "Save", then the new title is visible immediately.
- Given a recording has been renamed, when the page is reloaded, then the new title is still shown in both the library and the recording page.
- Given the "Title" field is empty, when the user clicks "Save", then the message "Title can't be empty." is visible and the old title is kept.

**Priority:** Must-have
**Effort:** Small

### Story 15 — Download a recording

**Story:** As a signed-in user, I want to download a recording as a video file so that I can use it outside the app.

**Acceptance criteria:**

- Given a recording, when the user clicks "Download", then the browser downloads a `.webm` file whose name is based on the recording's title.
- Given a downloaded file, when it is opened in Chrome, then it plays the same video as the recording page.

**Priority:** Must-have
**Effort:** Small

### Story 16 — Delete a recording

**Story:** As a signed-in user, I want to delete a recording so that I can clear out takes I don't need.

**Acceptance criteria:**

- Given a recording, when the user clicks "Delete", then a confirmation asks "Delete this recording? This can't be undone." with "Delete" and "Cancel" buttons.
- Given the confirmation is showing, when the user clicks "Delete", then the recording is no longer listed on `/`, and both its database entry and its video file are removed from the machine.
- Given the confirmation is showing, when the user clicks "Cancel", then the recording is still listed.
- Given a recording is deleted from its own page, when the delete completes, then the user lands on `/`.

**Priority:** Must-have
**Effort:** Small

### Story 22 — Camera-only recording

_Added in refinement batch 1._

**Story:** As a signed-in user, I want to record the camera only so that I can make a talking-head video.

**Acceptance criteria:**

- Given "Camera only" is selected on `/record`, when the browser has been given camera access, then a rectangular live camera view (not a round bubble) is visible, the "Camera background" and "Mirror camera" controls are visible, and the "Bubble position" control is not.
- Given "Camera only" is selected, when the user clicks "Start recording", then the browser does not show a screen-share prompt, the 3, 2, 1 countdown runs, and recording starts.
- Given a camera-only recording is saved, when it is played, then the camera fills the whole frame with no bubble, and its mode is stored as `camera`.
- Given "Camera only" is selected, when the user looks at the recorder before or during a recording, then a "Camera view size" control offers "Small", "Medium", and "Large", with "Large" selected.
- Given a camera-only recording is in progress, when the user switches "Camera view size", then the camera view on the page changes size immediately and the recording continues without interruption.
- Given two camera-only recordings made at different "Camera view size" settings, when both are played, then both show the full camera frame at the same resolution.
- Given "Camera only" is selected, when the microphone toggle, camera background, countdown, timer, pause, resume, stop, and cancel are used, then they behave exactly as in "Screen + camera".
- Given a camera-only recording has stopped, when the user looks at the browser, then the camera and microphone indicators have turned off.

**Priority:** Must-have
**Effort:** Medium

### Story 23 — Mirror the camera

_Added in refinement batch 1._

**Story:** As a user recording with the camera, I want to mirror the camera so that I look the way I do in a mirror.

**Acceptance criteria:**

- Given "Screen + camera" or "Camera only" is selected on `/record`, when the user looks at the setup controls, then a "Mirror camera" toggle is visible and switched off.
- Given "Screen only" is selected, when the user looks at `/record`, then the "Mirror camera" toggle is not visible.
- Given "Mirror camera" is switched on, when the user looks at the live camera view, then the picture is flipped left to right.
- Given "Mirror camera" is on, when a recording is made in either camera mode, then the camera in the saved video is flipped left to right, matching the preview.
- Given "Mirror camera" is on and "Custom image" is the camera background, when the user looks at the camera view or the saved video, then the person is flipped but the background image is not.
- Given "Mirror camera" is on in "Screen + camera", when a recording is made, then the screen content is not flipped.
- Given a user last recorded with "Mirror camera" on, when they next open `/record` in the same browser, then it is still on.

**Priority:** Must-have
**Effort:** Small

### Story 24 — Dim or hide my camera view

_Added in refinement batch 1._

**Story:** As a user recording with the camera, I want to dim or hide my own camera view so that I am not distracted by my face while recording.

**Acceptance criteria:**

- Given "Screen + camera" or "Camera only" is selected, when the user looks at the recorder before or during a recording, then a "Camera view" control offers "Show", "Dim", and "Hide", with "Show" selected.
- Given "Dim" is selected, when the user looks at the camera view on the page, then it is covered by a dark overlay so the picture is only faintly visible.
- Given "Hide" is selected, when the user looks at the page, then the camera picture is replaced by a dark placeholder reading "Camera hidden", and during a recording the placeholder adds "still recording" on a second line, with all of the text visible inside the round view.
- Given "Dim" or "Hide" is selected, when a recording is made and played back, then the camera appears in the saved video at normal brightness, exactly as with "Show".
- Given a recording is in progress, when the user switches between "Show", "Dim", and "Hide", then the page changes immediately and the recording continues without interruption.
- Given "Hide" is selected, when the user looks at the browser, then the camera indicator is still on, because the camera is still being recorded.
- Given a user last used "Dim", when they next open `/record` in the same browser, then "Dim" is preselected.

**Priority:** Must-have
**Effort:** Small

### Story 25 — Computer audio

_Added in refinement batch 2._

**Story:** As a user recording my screen, I want to include the sound my computer is playing so that viewers hear what I hear.

**Acceptance criteria:**

- Given "Screen only" or "Screen + camera" is selected on `/record`, when the page opens, then a "Computer audio" toggle is visible and switched off.
- Given "Camera only" is selected, when the user looks at `/record`, then the "Computer audio" toggle is not visible, because there is no share prompt in that mode.
- Given "Computer audio" is on, when the user clicks "Start recording", shares a tab or the entire screen, and ticks the audio option in the browser's prompt, then the saved video includes the sound that was playing.
- Given "Computer audio" and "Microphone" are both on, when a recording is made with audio shared, then the saved video includes both the computer's sound and the user's voice.
- Given "Computer audio" is on, when the user shares something without audio (the audio option left unticked, or a single window), then recording carries on, and the notice "Computer audio isn't being recorded, because no audio was shared in the browser's prompt." is visible on the recorder page.
- Given "Computer audio" is off, when a recording is made, then the saved video contains no computer sound.
- Given a user last recorded with "Computer audio" on, when they next open `/record` in the same browser, then it is still on.

**Priority:** Must-have
**Effort:** Small

### Story 26 — Floating controls

_Added in refinement batch 2._

**Story:** As a user who is recording another tab or app, I want floating controls that stay on top so that I can pause, stop, or cancel without going back to the recorder tab.

**Acceptance criteria:**

- Given a browser that offers a picture-in-picture window for web pages, when the user opens `/record`, then a "Floating controls" toggle is visible and switched on.
- Given "Floating controls" is on, when the user clicks "Start recording", then a small floating window opens that stays on top of other tabs and apps and shows the countdown, then a red recording dot and the elapsed time as mm:ss.
- Given the browser did not let the floating window open by itself, or the user closed it, when the user looks at the recorder page during the countdown or the recording, then an "Open floating controls" button is visible and opens it.
- Given the floating window is open, when the user clicks "Pause", "Resume", or "Stop" in it, then the recording behaves exactly as if the same button had been clicked on the recorder page.
- Given the floating window is open, when the user clicks "Cancel" in it, then it asks "Discard this recording?" with "Discard" and "Keep recording" buttons, and "Discard" throws the take away.
- Given the user closes the floating window with its own close button, when they look at the recorder page, then the recording is still in progress.
- Given a recording is stopped, cancelled, or never starts because the share prompt was dismissed, when that happens, then the floating window closes.
- Given a tab or a single window is being shared, when the saved video is played, then the floating window is not in it.
- Given the user shares their entire screen, when the share prompt closes, then the floating window closes before recording starts, so it is not in the saved video, and the recorder page shows a notice beginning "Floating controls are closed because you are sharing your entire screen".
- Given "Floating controls" is off, when a recording is started, then no floating window opens.

Known limit: floating controls cannot be used while the entire screen is shared, because a web page cannot keep one of its windows out of a whole-screen capture. The "Open floating controls" button still works for people who can drag the window to a second screen that is not being recorded.

**Priority:** Must-have
**Effort:** Medium

### Story 27 — Media key shortcuts

_Added in refinement batch 2._

**Story:** As a user who is recording my entire screen, I want to pause and stop with my keyboard's media keys so that I can control the recording without anything extra on screen.

**Acceptance criteria:**

- Given a user on `/record`, when the page opens, then a "Media key shortcuts" toggle is visible and switched on.
- Given "Media key shortcuts" is on and a recording is in progress, when the user presses the keyboard's Play/Pause key from any tab or app, then the recording pauses, and pressing it again resumes it, exactly as "Pause" and "Resume" do.
- Given "Media key shortcuts" is on and a recording is in progress or paused, when the user presses the Next track key from any tab or app, then the recording stops and is saved, exactly as "Stop" does.
- Given "Media key shortcuts" is on, when a recording is in progress, then the recorder page shows "Media keys: Play/Pause pauses and resumes. Next track stops and saves."
- Given a recording made with "Media key shortcuts" on, when it is played, then nothing has been added to its picture or sound.
- Given a recording has stopped or been cancelled, when the user presses the media keys, then they control the user's music player again.
- Given "Media key shortcuts" is off, when a recording is in progress, then the media keys are left alone.

Known limits: there is no media key for cancel, and while a recording is in progress the media keys do not control other players.

**Priority:** Must-have
**Effort:** Small

## Should-have

### Story 17 — Camera preview

**Story:** As a user setting up a camera recording, I want a live preview of my camera bubble and chosen background so that I can check how I look before I start.

**Acceptance criteria:**

- Given "Screen + camera" is selected on `/record`, when the browser has been given camera access, then a round live preview of the camera is visible.
- Given the preview is visible, when the user switches between "None", "Blur", and "Custom image", then the preview changes to match within two seconds.
- Given the user switches back to "Screen only", when the preview disappears, then the camera is switched off.

**Priority:** Should-have
**Effort:** Medium

### Story 18 — Bubble position

**Story:** As a user recording with the camera, I want to choose which corner the bubble sits in so that it doesn't cover what I'm showing.

**Acceptance criteria:**

- Given "Screen + camera" is selected, when the user looks at the "Bubble position" control, then the four corners are offered and "Bottom left" is selected.
- Given "Top right" is selected, when a recording is made, then the bubble appears in the top-right corner of the saved video.

**Priority:** Should-have
**Effort:** Small

### Story 19 — Cancel a take

**Story:** As a user who is recording, I want to cancel and discard the current take so that a bad recording doesn't end up in my library.

**Acceptance criteria:**

- Given a recording is in progress or paused, when the user clicks "Cancel" and confirms, then recording stops, nothing is saved, and the setup controls on `/record` are visible again.
- Given a take has been cancelled, when the user opens `/`, then no new recording is listed.

**Priority:** Should-have
**Effort:** Small

### Story 20 — Permission help

**Story:** As a user who denied a browser permission, I want a clear message telling me what to allow so that I can fix it and try again.

**Acceptance criteria:**

- Given the user blocks camera access, when "Screen + camera" is selected, then the message "Camera access is blocked. Allow it in your browser's site settings, then try again." is visible.
- Given the user blocks microphone access, when they click "Start recording" with the microphone on, then the message "Microphone access is blocked. Allow it in your browser's site settings, or turn the microphone off." is visible and no recording starts.

**Priority:** Should-have
**Effort:** Small

### Story 21 — Remember settings

**Story:** As a returning user, I want the recorder to remember my last mode, microphone, and background choices so that I don't set them up every time.

**Acceptance criteria:**

- Given a user last recorded with "Screen + camera", microphone off, and "Blur", when they next open `/record` in the same browser, then those three choices are preselected.
- Given a user last used "Custom image", when they next open `/record`, then the background falls back to "None", because the image itself is not kept.

**Priority:** Should-have
**Effort:** Small

## Nice-to-have

- Resize the camera bubble.
- Ordinary keyboard shortcuts (letter keys) for start, pause, and stop. They would only work while the recorder tab or the floating controls are focused; media keys (story 27) work from anywhere.
- Thumbnails and search in the library.
- Download recordings as MP4.

## Edge cases to discuss

- The user switches to another window while recording, so the recorder tab is in the background. The camera bubble and the timer must keep running; browsers slow down background tabs, so the drawing loop must not rely on the tab being visible.
- The user closes or reloads the recorder tab mid-recording. The take is lost. The page should warn before leaving while a recording is in progress.
- The save fails after Stop (for example the local server was stopped). The recording should not be silently thrown away: keep it in the page and offer "Try again" and "Download instead".
- The machine is too slow to run person detection smoothly. The bubble may lag; the build should still produce a valid recording with "None" as the fallback.
- A recording is stopped during the countdown or within the first second. Either save nothing or save a very short recording, but never leave a broken entry in the library.

## Questions for the team

1. Should the browser prompt for the camera as soon as "Screen + camera" is selected (needed for the preview), or only when "Start recording" is clicked? The build assumes on selection.
2. Is desktop Chrome or Edge an acceptable minimum, with a "browser not supported" notice elsewhere? The build assumes yes.
