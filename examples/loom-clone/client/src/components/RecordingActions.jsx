import { useState } from 'react'
import { useApi } from '../api/client.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import RenameForm from './RenameForm.jsx'

// Rename, Download and Delete for one recording. Used by the library rows
// and by the recording page.
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
      <button className="button" onClick={() => setRenaming(true)} data-testid="rename-button">
        Rename
      </button>
      <a className="button" href={api.downloadUrl(recording.id)} data-testid="download-link">
        Download
      </a>
      <button className="button" onClick={() => setConfirming(true)} data-testid="delete-button">
        Delete
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
