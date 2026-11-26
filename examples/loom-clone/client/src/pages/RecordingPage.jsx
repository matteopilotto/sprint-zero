import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../api/client.js'
import RecordingActions from '../components/RecordingActions.jsx'
import { formatDate, formatDuration } from '../format.js'

// Recordings are saved with their duration and a seek index, so this is only
// a safety net for a file that has neither (the player then reports a
// duration of Infinity). Seeking far past the end makes the browser find the
// real end; then we jump back to the start. Chrome sometimes fails that seek,
// so on an error we reload the video and leave it alone: it still plays.
function fixMissingDuration(event) {
  const video = event.currentTarget
  if (video.duration !== Infinity || video.dataset.durationFix) return
  video.dataset.durationFix = 'tried'
  const cleanUp = () => {
    video.removeEventListener('timeupdate', onTimeUpdate)
    video.removeEventListener('error', onError)
  }
  const onTimeUpdate = () => {
    if (video.duration === Infinity) return
    cleanUp()
    video.currentTime = 0
  }
  const onError = () => {
    cleanUp()
    video.load()
  }
  video.addEventListener('timeupdate', onTimeUpdate)
  video.addEventListener('error', onError)
  video.currentTime = 1e101
}

export default function RecordingPage() {
  const { id } = useParams()
  const api = useApi()
  const navigate = useNavigate()
  const [recording, setRecording] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setRecording(null)
    setError(null)
    api
      .getRecording(id)
      .then((data) => !cancelled && setRecording(data.recording))
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [api, id])

  if (error) {
    return (
      <>
        <p className="empty">{error.status === 404 ? 'Recording not found.' : error.message}</p>
        <Link to="/">Back to library</Link>
      </>
    )
  }
  if (!recording) return <p className="muted">Loading…</p>

  return (
    <>
      <Link to="/">Back to library</Link>
      <div className="page-head">
        <h1 data-testid="recording-title">{recording.title}</h1>
      </div>
      <p className="muted">
        <span data-testid="recording-duration">{formatDuration(recording.duration_seconds)}</span>
        {' · '}
        <span data-testid="recording-date">{formatDate(recording.created_at)}</span>
      </p>
      <video
        key={recording.id}
        className="player"
        src={api.fileUrl(recording.id)}
        controls
        preload="metadata"
        onLoadedMetadata={fixMissingDuration}
        data-testid="recording-video"
      />
      <RecordingActions
        recording={recording}
        onRenamed={setRecording}
        onDeleted={() => navigate('/', { replace: true })}
      />
    </>
  )
}
