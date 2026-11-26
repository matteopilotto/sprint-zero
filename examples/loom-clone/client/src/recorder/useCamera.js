// Owns the camera while "Screen + camera" or "Camera only" is selected. It
// draws every camera frame (mirrored if asked, with the chosen background)
// onto one canvas. That canvas is the live view on the page, and the recorder
// reads the bubble or the full camera-only frame from it. The drawing is
// driven by the worker ticker, so it keeps going in a background tab.
import { useEffect, useRef, useState } from 'react'
import { createTicker } from './ticker.js'
import { createSegmenter } from './segmenter.js'
import { drawCamera, drawCameraWithBackground } from './draw.js'

const SLOW_MS = 250 // average time per frame above which we give up on effects
const STUCK_MS = 5000

// `size` is the picture size to ask the camera for; a camera that cannot do it
// gives its nearest size. Changing it reopens the camera.
export function useCamera({ canvasRef, streamRef, enabled, size, background, backgroundImage, mirror, onEffectFailed }) {
  const [status, setStatus] = useState('off') // off | starting | ready | blocked | error
  const [effectReady, setEffectReady] = useState(false)

  // Latest settings, readable from the draw loop without restarting it.
  const live = useRef({})
  live.current = { background, backgroundImage, mirror, onEffectFailed }
  const run = useRef({ video: null, segmenter: null, busy: false, sentAt: 0, times: [] })

  const wantsEffect = enabled && background !== 'none'

  // Camera stream and draw loop.
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let stream = null
    let ticker = null
    const state = run.current
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    setStatus('starting')

    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: size.width }, height: { ideal: size.height } }, audio: false })
      .then((cameraStream) => {
        if (cancelled) {
          cameraStream.getTracks().forEach((track) => track.stop())
          return
        }
        stream = cameraStream
        streamRef.current = stream // "Camera only" records from this
        // The camera was unplugged or taken away by the system.
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          if (!cancelled) setStatus('error')
        })
        video.srcObject = stream
        video.play().catch(() => {})
        state.video = video
        setStatus('ready')
        ticker = createTicker(30, renderFrame)
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.name === 'NotAllowedError' ? 'blocked' : 'error')
      })

    return () => {
      cancelled = true
      ticker?.stop()
      stream?.getTracks().forEach((track) => track.stop())
      if (streamRef.current === stream) streamRef.current = null
      video.srcObject = null
      state.video = null
      setStatus('off')
    }
  }, [enabled, size.width, size.height])

  // Segmentation model, loaded only while Blur or Custom image is selected.
  useEffect(() => {
    if (!wantsEffect) return
    let cancelled = false
    let segmenter = null
    const state = run.current

    createSegmenter(drawResults)
      .then((loaded) => {
        if (cancelled) {
          loaded.close()
          return
        }
        segmenter = loaded
        Object.assign(state, { segmenter, busy: false, times: [] })
        setEffectReady(true)
      })
      .catch(() => {
        if (!cancelled) live.current.onEffectFailed()
      })

    return () => {
      cancelled = true
      state.segmenter = null
      state.busy = false
      segmenter?.close()
      setEffectReady(false)
    }
  }, [wantsEffect])

  function renderFrame() {
    const canvas = canvasRef.current
    const state = run.current
    const video = state.video
    if (!canvas || !video || video.readyState < 2 || !video.videoWidth) return
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    const { background, backgroundImage, mirror } = live.current
    const segmenter = state.segmenter
    const useEffectNow = segmenter && (background === 'blur' || (background === 'custom' && backgroundImage))
    if (!useEffectNow) {
      drawCamera(canvas.getContext('2d'), video, mirror)
      return
    }

    // One frame at a time: if the model is still busy, keep the last picture.
    if (state.busy) {
      if (performance.now() - state.sentAt > STUCK_MS) giveUp(segmenter)
      return
    }
    state.busy = true
    state.sentAt = performance.now()
    segmenter
      .send({ image: video })
      .then(() => {
        if (state.segmenter !== segmenter) return
        state.busy = false
        state.times.push(performance.now() - state.sentAt)
        // Ignore the first few frames (warm-up), then judge the average.
        if (state.times.length >= 25) {
          const recent = state.times.slice(5)
          const average = recent.reduce((sum, ms) => sum + ms, 0) / recent.length
          state.times = state.times.slice(0, 5)
          if (average > SLOW_MS) giveUp(segmenter)
        }
      })
      .catch(() => giveUp(segmenter))
  }

  function drawResults(results) {
    const canvas = canvasRef.current
    const { background, backgroundImage, mirror } = live.current
    if (!canvas || background === 'none') return
    drawCameraWithBackground(canvas.getContext('2d'), {
      image: results.image,
      mask: results.segmentationMask,
      background,
      backgroundImage,
      mirror,
    })
  }

  // Segmentation failed or is too slow: fall back to the real background.
  function giveUp(segmenter) {
    const state = run.current
    if (state.segmenter !== segmenter) return
    state.segmenter = null
    state.busy = false
    live.current.onEffectFailed()
  }

  return { status, effectReady }
}
