// Canvas drawing helpers shared by the camera preview and the recording.

// Draw `source` so it fills the whole canvas, cropping the overflow.
function drawCover(ctx, source, sourceWidth, sourceHeight) {
  const { width, height } = ctx.canvas
  const scale = Math.max(width / sourceWidth, height / sourceHeight)
  const w = sourceWidth * scale
  const h = sourceHeight * scale
  ctx.drawImage(source, (width - w) / 2, (height - h) / 2, w, h)
}

// Camera frame with the person kept sharp and the background replaced.
// `mask` is opaque where the person is.
export function drawCameraWithBackground(ctx, { image, mask, background, backgroundImage }) {
  const { width, height } = ctx.canvas
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(mask, 0, 0, width, height)
  ctx.globalCompositeOperation = 'source-in' // keep the camera only where the person is
  ctx.drawImage(image, 0, 0, width, height)
  ctx.globalCompositeOperation = 'destination-over' // paint behind the person
  if (background === 'custom' && backgroundImage) {
    drawCover(ctx, backgroundImage, backgroundImage.width, backgroundImage.height)
  } else {
    ctx.filter = 'blur(14px)'
    ctx.drawImage(image, -24, -24, width + 48, height + 48) // oversize to hide soft edges
  }
  ctx.restore()
}

// The round camera bubble, drawn on top of the screen frame.
// `position` is one of bottom-left, bottom-right, top-left, top-right.
export function drawBubble(ctx, cameraCanvas, position) {
  const { width, height } = ctx.canvas
  const short = Math.min(width, height)
  const size = Math.round(short * 0.24)
  const margin = Math.round(short * 0.03)
  const x = position.endsWith('left') ? margin : width - margin - size
  const y = position.startsWith('top') ? margin : height - margin - size
  const radius = size / 2

  // Take the centre square of the camera frame.
  const side = Math.min(cameraCanvas.width, cameraCanvas.height)
  const sx = (cameraCanvas.width - side) / 2
  const sy = (cameraCanvas.height - side) / 2

  ctx.save()
  ctx.beginPath()
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(cameraCanvas, sx, sy, side, side, x, y, size, size)
  ctx.restore()

  ctx.beginPath()
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2)
  ctx.lineWidth = Math.max(2, Math.round(size * 0.02))
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
}

// The shared screen, scaled to fit the canvas on a black background.
export function drawScreen(ctx, video) {
  const { width, height } = ctx.canvas
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  if (video.readyState < 2 || !video.videoWidth) return
  const scale = Math.min(width / video.videoWidth, height / video.videoHeight)
  const w = video.videoWidth * scale
  const h = video.videoHeight * scale
  ctx.drawImage(video, (width - w) / 2, (height - h) / 2, w, h)
}
