// Copies the person-segmentation files (script, wasm, model) out of
// node_modules into public/mediapipe so the app serves them itself.
// Nothing is ever fetched from a CDN at runtime.
import { cpSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'node_modules', '@mediapipe', 'selfie_segmentation')
const to = join(root, 'public', 'mediapipe')
const wanted = /\.(js|wasm|tflite|binarypb|data)$/

mkdirSync(to, { recursive: true })
for (const name of readdirSync(from)) {
  if (wanted.test(name)) cpSync(join(from, name), join(to, name))
}
console.log('Copied segmentation assets to public/mediapipe')
