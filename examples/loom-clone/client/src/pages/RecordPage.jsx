import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RecorderSetup from '../components/RecorderSetup.jsx'
import RecordingStage from '../components/RecordingStage.jsx'
import { loadSettings, saveSettings } from '../recorder/settings.js'
import { useCamera } from '../recorder/useCamera.js'
import { useRecorder } from '../recorder/useRecorder.js'

const CAMERA_BLOCKED = "Camera access is blocked. Allow it in your browser's site settings, then try again."
const supported =
  Boolean(navigator.mediaDevices?.getDisplayMedia) && typeof window.MediaRecorder !== 'undefined'

export default function RecordPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(loadSettings)
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [imageName, setImageName] = useState('')
  const [notice, setNotice] = useState('')

  // One canvas holds the camera picture: it is the round preview on this
  // page, and the recorder copies the bubble from it.
  const cameraCanvasRef = useRef(null)
  const getCameraCanvas = useCallback(() => cameraCanvasRef.current, [])
  const onSaved = useCallback(() => navigate('/'), [navigate])
  const recorder = useRecorder({ getCameraCanvas, onSaved })
  const { phase } = recorder

  // Segmentation failed to load or is too slow: use the real background.
  const onEffectFailed = useCallback(() => {
    setSettings((current) => ({ ...current, background: 'none' }))
    setNotice("Background effects aren't available on this device, so your real background is being used.")
  }, [])

  // The camera is on only while Screen + camera is selected, and it is
  // switched off as soon as the recording stops.
  const cameraWanted = settings.mode === 'screen_camera'
  const cameraOn = cameraWanted && ['setup', 'countdown', 'recording', 'paused'].includes(phase)
  const camera = useCamera({
    canvasRef: cameraCanvasRef,
    enabled: cameraOn,
    background: settings.background,
    backgroundImage,
    onEffectFailed,
  })

  function change(patch) {
    setNotice('')
    setSettings((current) => ({ ...current, ...patch }))
  }

  async function chooseImage(file) {
    try {
      setBackgroundImage(await createImageBitmap(file))
      setImageName(file.name)
      setNotice('')
    } catch {
      setNotice("That file couldn't be used as an image. Please choose another.")
    }
  }

  // Why "Start recording" is disabled, if it is.
  let hint = ''
  if (cameraWanted) {
    const needsEffect = settings.background !== 'none'
    if (camera.status === 'blocked') hint = CAMERA_BLOCKED
    else if (camera.status === 'error') hint = 'No camera could be used. Choose "Screen only" to record without it.'
    else if (camera.status !== 'ready') hint = 'Starting the camera…'
    else if (settings.background === 'custom' && !backgroundImage) hint = 'Choose an image to use as your background.'
    else if (needsEffect && !camera.effectReady) hint = 'Loading the background effect…'
  }
  const canStart = supported && !hint

  async function handleStart() {
    // Called straight from the click so the browser allows the screen picker.
    const started = await recorder.start({
      mode: settings.mode,
      micOn: settings.micOn,
      position: settings.position,
    })
    if (started) saveSettings(settings)
  }

  return (
    <>
      <Link to="/">Back to library</Link>
      <div className="page-head">
        <h1>Record</h1>
      </div>

      {!supported && (
        <p className="error" role="alert">
          Screen recording isn't supported in this browser. Please use desktop Chrome or Edge.
        </p>
      )}
      {recorder.error && (
        <p className="error" role="alert">
          {recorder.error}
        </p>
      )}
      {notice && <p className="notice">{notice}</p>}

      <div className="recorder">
        {phase === 'setup' ? (
          <RecorderSetup
            settings={settings}
            onChange={change}
            imageName={imageName}
            onImageChosen={chooseImage}
            hint={hint}
            canStart={canStart}
            onStart={handleStart}
          />
        ) : (
          <RecordingStage recorder={recorder} />
        )}

        {cameraOn && (
          <div className="camera-area">
            <canvas
              ref={cameraCanvasRef}
              className="camera-preview"
              width="640"
              height="480"
              aria-label="Camera preview"
              data-testid="camera-preview"
            />
          </div>
        )}
      </div>
    </>
  )
}
