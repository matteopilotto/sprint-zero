import { useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDuration } from '../format.js'

// What is shown inside the floating window: the countdown, then the timer
// with the same "Pause" / "Resume", "Stop" and "Cancel" as the recorder page.
// It is drawn by this page into the other window, so both always agree.
export default function FloatingControls({ floatingWindow, recorder }) {
  const { phase, countdown, elapsedSeconds } = recorder
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const paused = phase === 'paused'

  let content
  if (phase === 'countdown') {
    content = (
      <div className="countdown" data-testid="floating-countdown">
        {countdown}
      </div>
    )
  } else if (confirmingCancel) {
    content = (
      <>
        <div>Discard this recording?</div>
        <div className="row">
          <button
            className="danger"
            onClick={() => {
              setConfirmingCancel(false)
              recorder.cancel()
            }}
          >
            Discard
          </button>
          <button onClick={() => setConfirmingCancel(false)}>Keep recording</button>
        </div>
      </>
    )
  } else {
    content = (
      <>
        <div className="row">
          <span className={paused ? 'rec-dot paused' : 'rec-dot'} aria-hidden="true" />
          <span className="elapsed" data-testid="floating-elapsed-time">
            {formatDuration(elapsedSeconds)}
          </span>
          {paused && <span className="paused-label">Paused</span>}
        </div>
        <div className="row">
          <button onClick={paused ? recorder.resume : recorder.pause}>{paused ? 'Resume' : 'Pause'}</button>
          <button className="primary" onClick={recorder.stop}>
            Stop
          </button>
          <button onClick={() => setConfirmingCancel(true)}>Cancel</button>
        </div>
      </>
    )
  }

  return createPortal(content, floatingWindow.document.body)
}
