// Owns the camera while "Screen + camera" is selected. It draws every camera
// frame (with the chosen background) onto one canvas. That canvas is the
// round live preview, and the recorder also reads the bubble from it.
import { useEffect, useRef, useState } from 'react'
import { createTicker } from './ticker.js'
import { createSegmenter } from './segmenter.js'
import { drawCameraWithBackground } from './draw.js'

const SLOW_MS = 250 // average time per frame above which we give up on effects
const STUCK_MS = 5000

export function useCamera({ canvasRef, enabled, background, backgroundImage, onEffectFailed }) {
  const [status, setStatus] = useState('off') // off | starting | ready | blocked | error
  const [effectReady, setEffectReady] = useState(false)

  // Latest settings, readable from the draw loop without restarting it.
  const live = useRef({})
  live.current = { background, backgroundImage, onEffectFailed }
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
      .getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((cameraStream) => {
        if (cancelled) {
          cameraStream.getTracks().forEach((track) => track.stop())
          return
        }
        stream = cameraStream
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
      video.srcObject = null
      state.video = null
      setStatus('off')
    }
  }, [enabled])

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

    const { background, backgroundImage } = live.current
    const segmenter = state.segmenter
    const useEffectNow = segmenter && (background === 'blur' || (background === 'custom' && backgroundImage))
    if (!useEffectNow) {
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
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
    const { background, backgroundImage } = live.current
    if (!canvas || background === 'none') return
    drawCameraWithBackground(canvas.getContext('2d'), {
      image: results.image,
      mask: results.segmentationMask,
      background,
      backgroundImage,
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
