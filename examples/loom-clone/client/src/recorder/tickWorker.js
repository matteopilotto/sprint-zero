// Runs in a Web Worker. Browsers pause requestAnimationFrame and slow down
// timers in a background tab, but not in a worker, so the recorder's clock
// lives here and simply posts a "tick" back to the page.
let timer = null

self.onmessage = (event) => {
  clearInterval(timer)
  timer = null
  if (event.data.type === 'start') {
    timer = setInterval(() => self.postMessage('tick'), event.data.intervalMs)
  }
}
