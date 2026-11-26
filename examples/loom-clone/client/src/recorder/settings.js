// Remembers the last mode, microphone, background and bubble position in this
// browser. A custom image is not kept, so "custom" falls back to "none".
const KEY = 'loomclone_recorder_settings'

export const DEFAULT_SETTINGS = {
  mode: 'screen',
  micOn: true,
  background: 'none',
  position: 'bottom-left',
}

export function loadSettings() {
  try {
    const saved = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
    if (saved.background === 'custom') saved.background = 'none'
    return saved
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
