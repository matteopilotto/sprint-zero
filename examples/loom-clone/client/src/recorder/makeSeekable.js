// MediaRecorder writes WebM files with no duration and no seek index, and
// Chrome cannot reliably seek in them. Before upload we rewrite the file in
// the browser (copying the audio and video as they are, no re-encoding) so it
// has both. If anything goes wrong the original recording is used unchanged.
export async function makeSeekable(blob) {
  try {
    const { Input, Output, Conversion, BlobSource, BufferTarget, WebMOutputFormat, WEBM, MATROSKA } =
      await import('mediabunny')
    const input = new Input({ source: new BlobSource(blob), formats: [WEBM, MATROSKA] })
    const output = new Output({ format: new WebMOutputFormat(), target: new BufferTarget() })
    const conversion = await Conversion.init({ input, output })
    if (!conversion.isValid || conversion.discardedTracks.length > 0) return blob
    await conversion.execute()
    const fixed = new Blob([output.target.buffer], { type: 'video/webm' })
    return fixed.size > 0 ? fixed : blob
  } catch {
    return blob
  }
}
