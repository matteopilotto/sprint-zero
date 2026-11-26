// "Floating controls": a small always-on-top window, opened with the
// browser's picture-in-picture feature for web pages. It is a separate window,
// not part of the recorder page, so it is not in a recorded tab or window.
import { useCallback, useEffect, useRef, useState } from 'react'

export const canFloat = 'documentPictureInPicture' in window

// The floating window is its own document, so it needs its own styles.
const STYLES = `
  body { margin: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; background: #111; color: #fff; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 14px; }
  .row { display: flex; align-items: center; gap: 8px; }
  .elapsed { font-variant-numeric: tabular-nums; font-weight: 600; }
  .rec-dot { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; animation: pulse 1.2s infinite; }
  .rec-dot.paused { animation: none; opacity: 0.5; }
  .paused-label { color: #fbbf24; font-size: 12px; }
  .countdown { font-size: 44px; font-weight: 700; line-height: 1; }
  button { font: inherit; font-size: 13px; padding: 5px 12px; border-radius: 8px; border: 1px solid #3f3f46;
    background: #27272a; color: #fff; cursor: pointer; }
  button:hover { border-color: #71717a; }
  button.primary { background: #4f46e5; border-color: #4f46e5; }
  button.danger { background: #dc2626; border-color: #dc2626; }
  @keyframes pulse { 50% { opacity: 0.35; } }
`

export function useFloatingWindow() {
  const [floatingWindow, setFloatingWindow] = useState(null)
  const windowRef = useRef(null)
  const wantedRef = useRef(false)

  // The browser only allows this straight from a click. If it refuses,
  // nothing opens and the page offers an "Open floating controls" button.
  const open = useCallback(async () => {
    if (!canFloat || windowRef.current) return
    wantedRef.current = true
    try {
      const opened = await window.documentPictureInPicture.requestWindow({ width: 340, height: 110 })
      if (!wantedRef.current) {
        opened.close() // the recording ended (or never began) while it was opening
        return
      }
      opened.document.title = 'Recording controls'
      const style = opened.document.createElement('style')
      style.textContent = STYLES
      opened.document.head.append(style)
      // Closing the floating window by hand does not stop the recording.
      opened.addEventListener('pagehide', () => {
        if (windowRef.current !== opened) return
        windowRef.current = null
        setFloatingWindow(null)
      })
      windowRef.current = opened
      setFloatingWindow(opened)
    } catch {
      // Not allowed right now: the button on the page can try again.
    }
  }, [])

  const close = useCallback(() => {
    wantedRef.current = false
    const opened = windowRef.current
    windowRef.current = null
    setFloatingWindow(null)
    opened?.close()
  }, [])

  useEffect(() => close, [close]) // leaving the recorder page closes it

  return { floatingWindow, open, close }
}
