// Person segmentation (used for Blur and Custom image), fully local.
// The script, wasm and model files are copied from
// node_modules/@mediapipe/selfie_segmentation into public/mediapipe by
// scripts/copy-mediapipe.mjs, and every one of them is loaded from this app.
const ASSET_PATH = '/mediapipe/'

let scriptPromise = null

// The library is a classic script that defines window.SelfieSegmentation.
function loadScript() {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `${ASSET_PATH}selfie_segmentation.js`
      script.onload = resolve
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Could not load the segmentation script.'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

// onResults receives { image, segmentationMask } for each frame sent.
export async function createSegmenter(onResults) {
  await loadScript()
  const segmenter = new window.SelfieSegmentation({
    locateFile: (file) => `${ASSET_PATH}${file}`,
  })
  segmenter.setOptions({ modelSelection: 1 }) // the landscape model, the faster of the two
  segmenter.onResults(onResults)
  await segmenter.initialize()
  return segmenter
}
