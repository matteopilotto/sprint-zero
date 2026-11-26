// The recording state machine:
//   setup -> countdown -> starting -> recording <-> paused -> saving -> (saved | save_failed)
// All timing comes from performance.now() differences, never from counting
// ticks, so it stays right when the tab is in the background.
import { useEffect, useRef, useState } from 'react'
import { useApi } from '../api/client.js'
import { createTicker } from './ticker.js'
import { createCompositor } from './compositor.js'
import { makeSeekable } from './makeSeekable.js'

const COUNTDOWN_MS = 3000
// When the countdown ends the page needs a moment to remove it from the screen.
// Recording starts this long afterwards, so the last "1" is never in the video.
const SETTLE_MS = 250
const MIME_TYPES = ['video/webm;codecs=vp8,opus', 'video/webm']
const MIC_BLOCKED =
  "Microphone access is blocked. Allow it in your browser's site settings, or turn the microphone off."

const stopTracks = (stream) => stream?.getTracks().forEach((track) => track.stop())

// Recorded time so far, leaving out any paused time.
function elapsedMs(take) {
  const now = take.pauseStart ?? performance.now()
  return now - take.recordStart - take.pausedTotal
}

export function useRecorder({ getCameraCanvas, getCameraStream, onSaved }) {
  const api = useApi()
  const apiRef = useRef(api)
  apiRef.current = api

  const [phase, setPhaseState] = useState('setup')
  const [countdown, setCountdown] = useState(3)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [blobUrl, setBlobUrl] = useState(null)

  const phaseRef = useRef('setup')
  const takeRef = useRef(null) // everything belonging to the current take
  const startingRef = useRef(false)

  function setPhase(next) {
    phaseRef.current = next
    setPhaseState(next)
  }

  // Ends every screen and microphone track and stops the worker timer, so the
  // browser's sharing indicators turn off. (The camera itself is owned by
  // useCamera, which switches it off when the recording stops; the take only
  // ends its own copy of the camera picture.)
  function release(take) {
    take.ticker?.stop()
    take.sourceTrack?.removeEventListener('ended', take.onEnded)
    stopTracks(take.displayStream)
    stopTracks(take.micStream)
    stopTracks(take.cameraFeed)
    take.compositor?.dispose()
  }

  // "Camera only": the video track to record. With no mirror and no background
  // effect the camera is recorded as it is; otherwise the camera canvas (which
  // already has the flip and the background drawn in) is recorded.
  function cameraOnlyFeed(take, direct) {
    if (direct) return new MediaStream([take.sourceTrack.clone()])
    const canvas = getCameraCanvas()
    return canvas ? canvas.captureStream(30) : null
  }

  async function start({ mode, micOn, position, mirror, background }) {
    if (phaseRef.current !== 'setup' || startingRef.current) return false
    startingRef.current = true
    setError('')
    const take = { mode, chunks: [], pausedTotal: 0, pauseStart: null }
    try {
      if (mode === 'camera') {
        // No screen is shared in this mode, so there is no screen picker.
        // The camera is already running for the live view.
        take.sourceTrack = getCameraStream()?.getVideoTracks()[0]
        if (!take.sourceTrack || take.sourceTrack.readyState === 'ended') {
          setError('The camera stopped. Check that it is connected, then try again.')
          return false
        }
      } else {
        // The screen picker must come first, straight from the click.
        try {
          take.displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        } catch (err) {
          // Dismissing the picker is not an error: stay on the setup screen.
          if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
            setError("Screen sharing couldn't start. Please try again.")
          }
          return false
        }
        take.displayTrack = take.displayStream.getVideoTracks()[0]
        take.sourceTrack = take.displayTrack
      }

      if (micOn) {
        try {
          take.micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (err) {
          release(take)
          setError(err.name === 'NotAllowedError' ? MIC_BLOCKED : 'No microphone could be used. Turn the microphone off to record without sound.')
          return false
        }
      }
      // Sharing was stopped (or the camera went away) while we were asking.
      if (take.sourceTrack.readyState === 'ended') {
        release(take)
        if (mode === 'camera') setError('The camera stopped. Check that it is connected, then try again.')
        return false
      }

      // Screen only records the screen stream as it is. Screen + camera goes
      // through the compositor canvas. Camera only records the camera.
      let videoTrack = take.displayTrack
      if (mode === 'screen_camera') {
        take.compositor = createCompositor({ displayStream: take.displayStream, getCameraCanvas, position })
        videoTrack = take.compositor.stream.getVideoTracks()[0]
      } else if (mode === 'camera') {
        take.cameraFeed = cameraOnlyFeed(take, !mirror && background === 'none')
        videoTrack = take.cameraFeed?.getVideoTracks()[0]
        if (!videoTrack) {
          release(take)
          setError("The camera picture couldn't be recorded. Please try again.")
          return false
        }
      }
      take.stream = new MediaStream([videoTrack, ...(take.micStream?.getAudioTracks() ?? [])])

      // The browser's own "Stop sharing" button ends the screen track. In
      // "Camera only" there is no screen, so the camera track ending (for
      // example the camera being unplugged) stops the recording instead.
      take.onEnded = () => stop()
      take.sourceTrack.addEventListener('ended', take.onEnded)

      takeRef.current = take
      take.countdownStart = performance.now()
      setCountdown(3)
      setPhase('countdown')
      take.ticker = createTicker(mode === 'screen_camera' ? 30 : 10, onTick)
      return true
    } finally {
      startingRef.current = false
    }
  }

  function onTick() {
    const take = takeRef.current
    if (!take) return
    take.compositor?.draw()
    if (phaseRef.current === 'countdown') {
      const waited = performance.now() - take.countdownStart
      if (waited >= COUNTDOWN_MS) {
        // Take the countdown off the screen first; recording starts just after.
        setElapsedSeconds(0)
        setPhase('starting')
      } else setCountdown(3 - Math.floor(waited / 1000))
    } else if (phaseRef.current === 'starting') {
      if (performance.now() - take.countdownStart >= COUNTDOWN_MS + SETTLE_MS) beginRecording(take)
    } else if (phaseRef.current === 'recording') {
      setElapsedSeconds(Math.floor(elapsedMs(take) / 1000))
    }
  }

  // Runs just after the countdown has left the screen, so no countdown frames
  // are in the file.
  function beginRecording(take) {
    try {
      const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
      take.recorder = new MediaRecorder(take.stream, mimeType ? { mimeType } : undefined)
      take.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) take.chunks.push(event.data)
      }
      take.recorder.onstop = () => finish(take)
      take.recorder.onerror = () => stop()
      take.recorder.start(1000)
    } catch {
      release(take)
      takeRef.current = null
      setError("Recording couldn't start in this browser. Use desktop Chrome or Edge.")
      setPhase('setup')
      return
    }
    take.recordStart = performance.now()
    setElapsedSeconds(0)
    setPhase('recording')
  }

  function pause() {
    const take = takeRef.current
    if (phaseRef.current !== 'recording' || !take) return
    take.recorder.pause()
    take.pauseStart = performance.now()
    setElapsedSeconds(Math.floor(elapsedMs(take) / 1000))
    setPhase('paused')
  }

  function resume() {
    const take = takeRef.current
    if (phaseRef.current !== 'paused' || !take) return
    take.pausedTotal += performance.now() - take.pauseStart
    take.pauseStart = null
    take.recorder.resume()
    setPhase('recording')
  }

  // The one stop path, shared by the "Stop" button, "Stop sharing", and the
  // camera going away in "Camera only".
  // Safe to call more than once.
  function stop() {
    const take = takeRef.current
    if (!take || take.stopRequested) return
    if (!take.recorder) {
      cancel() // stopped during the countdown: nothing was recorded, save nothing
      return
    }
    take.stopRequested = true
    take.finalMs = elapsedMs(take)
    setPhase('saving')
    if (take.recorder.state !== 'inactive') take.recorder.stop()
    // finish() runs from the recorder's stop event, after the last chunk.
  }

  async function finish(take) {
    if (take.finished) return
    take.finished = true
    if (!take.stopRequested) {
      // The recorder ended by itself (its tracks ended) before stop() ran.
      take.stopRequested = true
      take.finalMs = elapsedMs(take)
    }
    release(take)
    if (take.cancelled) return

    const raw = new Blob(take.chunks, { type: 'video/webm' })
    take.chunks = []
    take.durationSeconds = Math.max(0, Math.floor(take.finalMs / 1000))
    take.blob = raw.size > 0 ? await makeSeekable(raw) : raw
    if (take.cancelled) return // the page was left while the file was being prepared
    if (take.blob.size === 0) {
      takeRef.current = null
      setError('Nothing was recorded. Please try again.')
      setPhase('setup')
      return
    }
    upload(take)
  }

  async function upload(take) {
    if (take.uploading || take.saved) return // never upload the same take twice
    take.uploading = true
    setSaveError('')
    setPhase('saving')
    try {
      await apiRef.current.createRecording({
        blob: take.blob,
        mode: take.mode,
        durationSeconds: take.durationSeconds,
      })
      take.saved = true
      takeRef.current = null
      setPhase('saved')
      onSaved()
    } catch (err) {
      // Keep the recording in the page so it is not lost.
      take.blobUrl ??= URL.createObjectURL(take.blob)
      setBlobUrl(take.blobUrl)
      setSaveError(err.message)
      setPhase('save_failed')
    } finally {
      take.uploading = false
    }
  }

  function retrySave() {
    if (takeRef.current?.blob) upload(takeRef.current)
  }

  // Throw the current take away and go back to the setup controls.
  function cancel() {
    const take = takeRef.current
    if (!take) return
    take.cancelled = true
    takeRef.current = null
    if (take.recorder && take.recorder.state !== 'inactive') take.recorder.stop()
    release(take)
    setPhase('setup')
  }

  // Warn before closing or reloading the tab while a take could be lost.
  const atRisk = ['countdown', 'starting', 'recording', 'paused', 'saving', 'save_failed'].includes(phase)
  useEffect(() => {
    if (!atRisk) return
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [atRisk])

  // Leaving the page: stop everything.
  useEffect(
    () => () => {
      const take = takeRef.current
      if (!take) return
      take.cancelled = true
      if (take.recorder && take.recorder.state !== 'inactive') take.recorder.stop()
      release(take)
      if (take.blobUrl) URL.revokeObjectURL(take.blobUrl)
    },
    [],
  )

  return { phase, countdown, elapsedSeconds, error, saveError, blobUrl, start, pause, resume, stop, cancel, retrySave }
}
