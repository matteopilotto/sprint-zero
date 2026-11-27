import { useState } from 'react'
import { useApi } from '../api/client.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import RenameForm from './RenameForm.jsx'

// Rename, Download and Delete for one recording. Used by the library rows
// and cards and by the recording page. Each is a button showing only an
// icon; its name shows on hover (title) and is read out (aria-label).
// The icons are drawn here, so nothing is loaded to show them.
function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export default function RecordingActions({ recording, onRenamed, onDeleted }) {
  const api = useApi()
  const [renaming, setRenaming] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      await api.deleteRecording(recording.id)
      setConfirming(false)
      onDeleted(recording)
    } catch (err) {
      setError(err.message)
      setConfirming(false)
      setDeleting(false)
    }
  }

  if (renaming) {
    return (
      <RenameForm
        recording={recording}
        onCancel={() => setRenaming(false)}
        onRenamed={(updated) => {
          setRenaming(false)
          onRenamed(updated)
        }}
      />
    )
  }

  return (
    <div className="row-actions">
      <button
        className="button icon-button"
        type="button"
        title="Rename"
        aria-label="Rename"
        onClick={() => setRenaming(true)}
        data-testid="rename-button"
      >
        <Icon>
          <path d="M4 20h4L19 9l-4-4L4 16v4z" />
          <path d="M13 7l4 4" />
        </Icon>
      </button>
      <a
        className="button icon-button"
        href={api.downloadUrl(recording.id)}
        title="Download"
        aria-label="Download"
        data-testid="download-link"
      >
        <Icon>
          <path d="M12 4v11" />
          <path d="M7 11l5 5 5-5" />
          <path d="M5 20h14" />
        </Icon>
      </a>
      <button
        className="button icon-button"
        type="button"
        title="Delete"
        aria-label="Delete"
        onClick={() => setConfirming(true)}
        data-testid="delete-button"
      >
        <Icon>
          <path d="M4 7h16" />
          <path d="M9 7V4h6v3" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </Icon>
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {confirming && (
        <ConfirmDialog
          message="Delete this recording? This can't be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
