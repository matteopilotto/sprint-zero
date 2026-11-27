import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import { formatDuration } from '../format.js'

// What the recorder shows once "Start recording" has been clicked:
// the countdown, then the timer overlay and controls, then the save status.
export default function RecordingStage({ recorder, mode, floating, mediaKeysOn }) {
  const { phase, countdown, elapsedSeconds, saveError, notice, wholeScreen, blobUrl, blobName } = recorder
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  // Shown when the browser offers a floating window and it is not open, either
  // because the browser did not allow it to open by itself or it was closed.
  const openFloating = floating.available && !floating.isOpen && (
    <button className="button" onClick={floating.open} data-testid="open-floating-controls-button">
      Open floating controls
    </button>
  )

  // Sharing the entire screen records everything on it, floating window included.
  const floatingClosed = floating.available && wholeScreen && !floating.isOpen && (
    <p className="notice">
      Floating controls are closed because you are sharing your entire screen, and they would appear in the video.
      Share a tab or a window to use them. With a second screen, you can open them and drag them there.
    </p>
  )

  if (phase === 'countdown') {
    return (
      <div className="card stage">
        <p className="countdown" data-testid="countdown" aria-live="assertive">
          {countdown}
        </p>
        <p className="muted">Recording starts when the countdown ends.</p>
        {floatingClosed}
        {openFloating}
      </div>
    )
  }

  if (phase === 'saving' || phase === 'saved') {
    return (
      <div className="card stage">
        <p role="status">Saving recording…</p>
      </div>
    )
  }

  if (phase === 'save_failed') {
    return (
      <div className="card stage">
        <p className="error" role="alert">
          The recording couldn't be saved. {saveError}
        </p>
        <p className="muted">It is still held in this page. Don't close the tab until it is safe.</p>
        <div className="row-actions">
          <button className="button primary" onClick={recorder.retrySave}>
            Try again
          </button>
          <a className="button" href={blobUrl} download={blobName}>
            Download instead
          </a>
        </div>
      </div>
    )
  }

  const paused = phase === 'paused'
  return (
    <div className="card stage">
      <div className="overlay" data-testid="recording-overlay">
        <span className={paused ? 'rec-dot paused' : 'rec-dot'} aria-hidden="true" />
        <span className="elapsed" data-testid="elapsed-time">
          {formatDuration(elapsedSeconds)}
        </span>
        {paused && <span className="paused-label">Paused</span>}
      </div>
      <div className="row-actions">
        <button className="button" onClick={paused ? recorder.resume : recorder.pause} data-testid="pause-button">
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="button primary" onClick={recorder.stop} data-testid="stop-button">
          Stop
        </button>
        <button className="button" onClick={() => setConfirmingCancel(true)} data-testid="cancel-recording-button">
          Cancel
        </button>
      </div>
      {notice && <p className="notice">{notice}</p>}
      {floatingClosed}
      {openFloating}
      <p className="muted">
        {floating.isOpen
          ? 'Recording carries on if you switch to another tab or window. Use the floating controls to pause, stop, or cancel from there.'
          : mode === 'camera'
            ? 'Recording carries on if you switch to another tab or window. Come back to this tab to pause or stop.'
            : 'Recording another window? Come back to this tab to pause or stop, or use the browser\'s "Stop sharing" button.'}
      </p>
      {mediaKeysOn && (
        <p className="muted">Media keys: Play/Pause pauses and resumes. Next track stops and saves.</p>
      )}
      {confirmingCancel && (
        <ConfirmDialog
          message="Discard this recording? Nothing will be saved."
          confirmLabel="Discard"
          cancelLabel="Keep recording"
          onConfirm={() => {
            setConfirmingCancel(false)
            recorder.cancel()
          }}
          onCancel={() => setConfirmingCancel(false)}
        />
      )}
    </div>
  )
}
