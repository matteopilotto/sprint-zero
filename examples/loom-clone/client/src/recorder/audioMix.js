// A video file holds one soundtrack, so when both the computer's audio and
// the microphone are recorded they are mixed into a single audio track here.
// Web Audio keeps running when the tab is in the background.
export function mixAudio(tracks) {
  const context = new AudioContext()
  const destination = context.createMediaStreamDestination()
  for (const track of tracks) {
    context.createMediaStreamSource(new MediaStream([track])).connect(destination)
  }
  context.resume().catch(() => {})
  return {
    track: destination.stream.getAudioTracks()[0],
    dispose() {
      context.close().catch(() => {})
    },
  }
}
