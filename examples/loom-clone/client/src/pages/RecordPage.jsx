import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RecorderSetup from '../components/RecorderSetup.jsx'
import RecordingStage from '../components/RecordingStage.jsx'
import CameraView from '../components/CameraView.jsx'
import { loadSettings, saveSettings, saveSettingsPatch } from '../recorder/settings.js'
import { useCamera } from '../recorder/useCamera.js'
import { useRecorder } from '../recorder/useRecorder.js'

const CAMERA_BLOCKED = "Camera access is blocked. Allow it in your browser's site settings, then try again."
const canRecord = Boolean(navigator.mediaDevices?.getUserMedia) && typeof window.MediaRecorder !== 'undefined'
const canShareScreen = Boolean(navigator.mediaDevices?.getDisplayMedia)

export default function RecordPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(loadSettings)
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [imageName, setImageName] = useState('')
  const [notice, setNotice] = useState('')

  // One canvas holds the camera picture: it is the live view on this page,
  // and the recorder copies the bubble (or the whole camera-only frame) from it.
  const cameraCanvasRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const getCameraCanvas = useCallback(() => cameraCanvasRef.current, [])
  const getCameraStream = useCallback(() => cameraStreamRef.current, [])
  const onSaved = useCallback(() => navigate('/'), [navigate])
  const recorder = useRecorder({ getCameraCanvas, getCameraStream, onSaved })
  const { phase } = recorder

  // Segmentation failed to load or is too slow: use the real background.
  const onEffectFailed = useCallback(() => {
    setSettings((current) => ({ ...current, background: 'none' }))
    setNotice("Background effects aren't available on this device, so your real background is being used.")
  }, [])

  // The camera is on only while Screen + camera or Camera only is selected,
  // and it is switched off as soon as the recording stops.
  const cameraWanted = settings.mode !== 'screen'
  const supported = canRecord && (settings.mode === 'camera' || canShareScreen)
  const cameraOn = cameraWanted && ['setup', 'countdown', 'starting', 'recording', 'paused'].includes(phase)
  const camera = useCamera({
    canvasRef: cameraCanvasRef,
    streamRef: cameraStreamRef,
    enabled: cameraOn,
    background: settings.background,
    backgroundImage,
    mirror: settings.mirror,
    onEffectFailed,
  })

  function change(patch) {
    setNotice('')
    setSettings((current) => ({ ...current, ...patch }))
  }

  // "Camera view" and "Camera view size" can change during a recording, so
  // they are remembered straight away rather than when a recording starts.
  function changeView(patch) {
    setSettings((current) => ({ ...current, ...patch }))
    saveSettingsPatch(patch)
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
    else if (camera.status === 'error') {
      hint =
        settings.mode === 'camera'
          ? 'No camera could be used. Connect a camera, or choose "Screen only".'
          : 'No camera could be used. Choose "Screen only" to record without it.'
    }
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
      mirror: settings.mirror,
      background: settings.background,
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
          {settings.mode === 'camera' ? 'Recording' : 'Screen recording'} isn't supported in this browser. Please use
          desktop Chrome or Edge.
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
          <RecordingStage recorder={recorder} mode={settings.mode} />
        )}

        {cameraOn && (
          <CameraView
            canvasRef={cameraCanvasRef}
            mode={settings.mode}
            settings={settings}
            onChange={changeView}
            recording={phase !== 'setup'}
          />
        )}
      </div>
    </>
  )
}
