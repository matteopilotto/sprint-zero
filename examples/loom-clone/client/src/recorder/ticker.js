// Calls onTick about `fps` times a second, even when the tab is hidden.
export function createTicker(fps, onTick) {
  const worker = new Worker(new URL('./tickWorker.js', import.meta.url), { type: 'module' })
  worker.onmessage = () => onTick()
  worker.postMessage({ type: 'start', intervalMs: Math.round(1000 / fps) })
  return {
    stop() {
      worker.onmessage = null
      worker.terminate()
    },
  }
}
