// "Screen + camera" only: draws the shared screen and the camera bubble onto
// one canvas, and exposes that canvas as a video stream for the recorder.
import { drawBubble, drawScreen } from './draw.js'

const MAX_EDGE = 1920 // keep very large screens affordable to draw 30 times a second

export function createCompositor({ displayStream, getCameraCanvas, position }) {
  const settings = displayStream.getVideoTracks()[0].getSettings()
  const sourceWidth = settings.width || 1280
  const sourceHeight = settings.height || 720
  const scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round((sourceWidth * scale) / 2) * 2 // encoders prefer even sizes
  canvas.height = Math.round((sourceHeight * scale) / 2) * 2
  const ctx = canvas.getContext('2d')

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.srcObject = displayStream
  video.play().catch(() => {})

  const stream = canvas.captureStream(30)

  function draw() {
    drawScreen(ctx, video)
    const camera = getCameraCanvas()
    if (camera && camera.width > 0 && camera.height > 0) drawBubble(ctx, camera, position)
  }
  draw()

  return {
    stream,
    draw,
    dispose() {
      stream.getTracks().forEach((track) => track.stop())
      video.pause()
      video.srcObject = null
    },
  }
}
