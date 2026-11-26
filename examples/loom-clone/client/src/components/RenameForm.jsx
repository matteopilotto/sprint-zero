import { useId, useState } from 'react'
import { useApi } from '../api/client.js'

export default function RenameForm({ recording, onRenamed, onCancel }) {
  const api = useApi()
  const inputId = useId()
  const [title, setTitle] = useState(recording.title)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) {
      setError("Title can't be empty.")
      return
    }
    setBusy(true)
    setError('')
    try {
      const data = await api.renameRecording(recording.id, title)
      onRenamed(data.recording)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form className="rename-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId}>Title</label>
      <input
        id={inputId}
        name="title"
        type="text"
        maxLength={200}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button className="button primary" type="submit" disabled={busy} data-testid="save-recording">
        Save
      </button>
      <button className="button" type="button" onClick={onCancel} disabled={busy}>
        Cancel
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
