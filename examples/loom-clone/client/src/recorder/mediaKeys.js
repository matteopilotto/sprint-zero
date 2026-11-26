// "Media key shortcuts": lets the keyboard's Play/Pause and Next track keys
// control the recording from any tab or app.
//
// The browser only sends media keys to a page that is playing sound, so a
// silent sound is played on a loop for as long as the take lasts. It is pure
// silence, so it adds nothing to a recording that includes computer audio.
// While it plays, the keys come here instead of going to a music player.

const SAMPLE_RATE = 8000
const SECONDS = 30

// A WAV file of silence, built in memory so nothing is downloaded.
function silentWavUrl() {
  const samples = SAMPLE_RATE * SECONDS
  const view = new DataView(new ArrayBuffer(44 + samples))
  const text = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  text(8, 'WAVEfmt ')
  view.setUint32(16, 16, true) // size of the format block
  view.setUint16(20, 1, true) // plain uncompressed sound
  view.setUint16(22, 1, true) // one channel
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE, true) // bytes per second
  view.setUint16(32, 1, true) // bytes per sample
  view.setUint16(34, 8, true) // bits per sample
  text(36, 'data')
  view.setUint32(40, samples, true)
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128) // 128 is silence in 8-bit sound
  return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }))
}

export const canUseMediaKeys = 'mediaSession' in navigator

// onPauseResume and onStop are called when the keys are pressed.
export function createMediaKeys({ onPauseResume, onStop }) {
  const url = silentWavUrl()
  const audio = new Audio(url)
  audio.loop = true
  audio.play().catch(() => {}) // if the browser refuses, the keys just don't work

  const session = navigator.mediaSession
  const handlers = { play: onPauseResume, pause: onPauseResume, nexttrack: onStop, stop: onStop }
  const set = (action, handler) => {
    try {
      session.setActionHandler(action, handler)
    } catch {
      // This browser doesn't know this key.
    }
  }
  for (const [action, handler] of Object.entries(handlers)) set(action, handler)
  if (window.MediaMetadata) session.metadata = new MediaMetadata({ title: 'Recording in progress', artist: 'Loom clone' })

  return {
    dispose() {
      for (const action of Object.keys(handlers)) set(action, null)
      session.metadata = null
      audio.pause()
      audio.removeAttribute('src')
      URL.revokeObjectURL(url)
    },
  }
}
