import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../api/client.js'
import RecordingActions from '../components/RecordingActions.jsx'
import { formatDate, formatDuration } from '../format.js'

export default function LibraryPage() {
  const api = useApi()
  const navigate = useNavigate()
  const [recordings, setRecordings] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .listRecordings()
      .then((data) => !cancelled && setRecordings(data.recordings))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [api])

  const replace = (updated) =>
    setRecordings((list) => list.map((r) => (r.id === updated.id ? updated : r)))
  const remove = (deleted) => setRecordings((list) => list.filter((r) => r.id !== deleted.id))

  return (
    <>
      <div className="page-head">
        <h1>Your recordings</h1>
        <button className="button primary" onClick={() => navigate('/record')} data-testid="new-recording-button">
          New recording
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!error && recordings === null && <p className="muted">Loading…</p>}
      {recordings?.length === 0 && <p className="empty">No recordings yet.</p>}

      {recordings?.length > 0 && (
        <ul className="recording-list">
          {recordings.map((recording) => (
            <li key={recording.id} className="card recording-row" data-testid="recording-row">
              <div className="recording-info">
                <Link to={`/recordings/${recording.id}`} className="recording-title">
                  {recording.title}
                </Link>
                <p className="muted">
                  <span data-testid="recording-duration">{formatDuration(recording.duration_seconds)}</span>
                  {' · '}
                  <span data-testid="recording-date">{formatDate(recording.created_at)}</span>
                </p>
              </div>
              <RecordingActions recording={recording} onRenamed={replace} onDeleted={remove} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
