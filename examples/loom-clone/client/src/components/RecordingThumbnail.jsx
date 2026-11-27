import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../api/client.js'
import { formatLength } from '../format.js'

// A still picture from the start of a recording, for the library's "Grid"
// view. Nothing is stored: the browser reads the start of the video the
// server already serves and shows one frame of it. The "#t=0.1" on the end
// of the address asks for the frame just after the start, which is what
// makes the browser draw a picture without playing. If the video cannot be
// loaded, the dark 16:9 box is left on its own. The recording's length sits
// in a badge in the bottom-right corner either way.
export default function RecordingThumbnail({ recording }) {
  const api = useApi()
  const [failed, setFailed] = useState(false)

  return (
    <Link
      to={`/recordings/${recording.id}`}
      className="thumbnail"
      aria-label={recording.title}
      data-testid="recording-thumbnail"
    >
      {!failed && (
        <video
          src={`${api.fileUrl(recording.id)}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          disablePictureInPicture
          tabIndex={-1}
          aria-hidden="true"
          onError={() => setFailed(true)}
        />
      )}
      <span className="thumbnail-badge" data-testid="recording-duration">
        {formatLength(recording.duration_seconds)}
      </span>
    </Link>
  )
}
