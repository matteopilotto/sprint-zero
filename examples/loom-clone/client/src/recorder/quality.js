// "Video quality": how large the recorded picture may be, and how much data
// the recorder may spend on it. The names are limits: the picture is fitted
// inside the box with its shape kept, and is never enlarged.
const LIMITS = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  original: { width: 3840, height: 2160 }, // the captured size, up to 4K
}

export const AUDIO_BITS_PER_SECOND = 128_000

export function frameLimit(quality) {
  return LIMITS[quality] ?? LIMITS['1080p']
}

// The size the camera is opened at. In "Screen + camera" the bubble is small,
// so 640x480 is plenty. "Camera only" follows the quality, but stays at 720p
// or below while a background effect is redrawing every frame.
export function cameraSize({ mode, quality, background }) {
  if (mode !== 'camera') return { width: 640, height: 480 }
  if (quality === '720p' || background !== 'none') return { width: 1280, height: 720 }
  return { width: 1920, height: 1080 }
}

// A data rate that follows the picture size: about 2.5 Mbps at 720p, 5 Mbps
// at 1080p and 20 Mbps at 4K. Left to itself the browser spends about
// 2.5 Mbps whatever the size, which makes large pictures blurry.
export function videoBitsPerSecond(width, height) {
  return Math.round(Math.min(20_000_000, Math.max(2_500_000, width * height * 2.4)))
}

// MP4 with H.264 video and AAC sound, which is what new recordings are saved
// as. The first entry lets the browser pick the H.264 level for the picture
// size; the second names one outright (5.1 covers 4K, 4.0 covers 1080p).
export function mp4MimeTypes({ quality }) {
  const level = quality === 'original' ? '640033' : '640028'
  return ['video/mp4;codecs=avc1,mp4a.40.2', `video/mp4;codecs=avc1.${level},mp4a.40.2`]
}

// WebM, used only when the browser cannot record MP4 itself.
// VP9 looks better at the same file size but is heavier to encode, so it is
// used only when no camera effect is running and the picture is 1080p or less.
export function mimeTypes({ quality, effectOn }) {
  const light = ['video/webm;codecs=vp8,opus', 'video/webm']
  return effectOn || quality === 'original' ? light : ['video/webm;codecs=vp9,opus', ...light]
}
