import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// A small modal confirmation. While it is open the page behind it is made
// inert, so the only reachable buttons are the two in the dialog.
export default function ConfirmDialog({ message, confirmLabel, cancelLabel, onConfirm, onCancel, busy }) {
  useEffect(() => {
    const root = document.getElementById('root')
    root.inert = true
    return () => {
      root.inert = false
    }
  }, [])

  return createPortal(
    <div className="dialog-backdrop">
      <div className="card dialog" role="dialog" aria-modal="true" aria-label={message}>
        <p>{message}</p>
        <div className="row-actions">
          <button className="button danger" onClick={onConfirm} disabled={busy} data-testid="confirm-button">
            {confirmLabel}
          </button>
          <button className="button" onClick={onCancel} disabled={busy} data-testid="cancel-button">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
