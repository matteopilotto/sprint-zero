// Turns a finished take into the MP4 file that is saved: H.264 video and AAC
// sound, with the length and seek index at the start of the file so it plays
// and seeks in the browser, QuickTime, Google Drive, and YouTube.
//
// When the browser recorded H.264 and AAC itself, the sound and picture are
// copied as they are (fast, no quality loss). When it could only record WebM,
// they are re-encoded here in the browser, which takes longer. Nothing is
// installed and nothing leaves the machine.
//
// Returns null if an MP4 cannot be made, so the caller can keep the original.
import { AUDIO_BITS_PER_SECOND, videoBitsPerSecond } from './quality.js'

export async function toMp4(blob) {
  try {
    const { Input, Output, Conversion, BlobSource, BufferTarget, Mp4OutputFormat, MP4, WEBM, MATROSKA } =
      await import('mediabunny')
    const input = new Input({ source: new BlobSource(blob), formats: [MP4, WEBM, MATROSKA] })
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() })
    const conversion = await Conversion.init({
      input,
      output,
      showWarnings: false,
      // Naming a data rate forces re-encoding, so it is only named when the
      // track is not already in the right codec.
      video: (track) =>
        track.codec === 'avc'
          ? { codec: 'avc' }
          : { codec: 'avc', bitrate: videoBitsPerSecond(track.displayWidth, track.displayHeight) },
      audio: (track) => (track.codec === 'aac' ? { codec: 'aac' } : { codec: 'aac', bitrate: AUDIO_BITS_PER_SECOND }),
    })
    // A discarded track would mean a file with no picture or no sound.
    if (!conversion.isValid || conversion.discardedTracks.length > 0) return null
    await conversion.execute()
    const mp4 = new Blob([output.target.buffer], { type: 'video/mp4' })
    return mp4.size > 0 ? mp4 : null
  } catch {
    return null
  }
}

// The name a take is uploaded and downloaded under, from its format.
export function fileNameFor(blob) {
  return blob?.type.startsWith('video/mp4') ? 'recording.mp4' : 'recording.webm'
}
