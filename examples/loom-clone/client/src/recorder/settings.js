// Remembers the last mode, microphone, computer audio, floating controls, media keys,
// background, bubble position, mirror and camera view choices in this browser. A custom image is not kept, so "custom"
// falls back to "none".
const KEY = 'loomclone_recorder_settings'

export const DEFAULT_SETTINGS = {
  mode: 'screen',
  micOn: true,
  computerAudio: false,
  floatingControls: true,
  mediaKeys: true,
  background: 'none',
  position: 'bottom-left',
  mirror: false,
  cameraView: 'show',
  viewSize: 'large',
}

const ALLOWED = {
  mode: ['screen', 'screen_camera', 'camera'],
  background: ['none', 'blur', 'custom'],
  position: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
  cameraView: ['show', 'dim', 'hide'],
  viewSize: ['small', 'medium', 'large'],
}

// Fills in anything missing or unrecognised with the default, so settings
// saved by an older version of the app still load.
export function normalizeSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const settings = { ...DEFAULT_SETTINGS }
  for (const key of Object.keys(ALLOWED)) {
    if (ALLOWED[key].includes(source[key])) settings[key] = source[key]
  }
  for (const key of ['micOn', 'computerAudio', 'floatingControls', 'mediaKeys', 'mirror']) {
    if (typeof source[key] === 'boolean') settings[key] = source[key]
  }
  if (settings.background === 'custom') settings.background = 'none'
  return settings
}

export function loadSettings() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(KEY) || '{}'))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Storage is full or switched off: the choices just aren't remembered.
  }
}

// Saves only some of the choices, leaving the rest as they were last saved.
// Used for the camera view controls, which can change during a recording.
export function saveSettingsPatch(patch) {
  saveSettings({ ...loadSettings(), ...patch })
}
