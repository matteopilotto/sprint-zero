import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../api/client.js'
import RecordingActions from '../components/RecordingActions.jsx'
import RecordingThumbnail from '../components/RecordingThumbnail.jsx'
import { formatAge, formatDate, formatDuration } from '../format.js'

// The "View" choice is remembered in this browser, not on the server.
const VIEW_KEY = 'loomclone_library_view'
const VIEW_OPTIONS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
]

function loadView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

function saveView(view) {
  try {
    localStorage.setItem(VIEW_KEY, view)
  } catch {
    // Storage is full or switched off: the choice just isn't remembered.
  }
}

export default function LibraryPage() {
  const api = useApi()
  const navigate = useNavigate()
  const [recordings, setRecordings] = useState(null)
  const [error, setError] = useState('')
  const [view, setView] = useState(loadView)

  const chooseView = (next) => {
    setView(next)
    saveView(next)
  }

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
        <div className="view-control" data-testid="view-control">
          <label htmlFor="library-view">View</label>
          <select id="library-view" name="library-view" value={view} onChange={(e) => chooseView(e.target.value)}>
            {VIEW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {recordings?.length > 0 && view === 'grid' && (
        <ul className="recording-grid">
          {recordings.map((recording) => (
            <li key={recording.id} className="card recording-card" data-testid="recording-card">
              <RecordingThumbnail recording={recording} />
              <div className="recording-card-body">
                <span className="muted" title={formatDate(recording.created_at)} data-testid="recording-date">
                  {formatAge(recording.created_at)}
                </span>
                <Link to={`/recordings/${recording.id}`} className="recording-title">
                  {recording.title}
                </Link>
                <RecordingActions recording={recording} onRenamed={replace} onDeleted={remove} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {recordings?.length > 0 && view === 'list' && (
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
