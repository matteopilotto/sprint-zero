import { useRef } from 'react'
import RadioGroup from './RadioGroup.jsx'

const MODES = [
  { value: 'screen', label: 'Screen only' },
  { value: 'screen_camera', label: 'Screen + camera' },
]
const BACKGROUNDS = [
  { value: 'none', label: 'None' },
  { value: 'blur', label: 'Blur' },
  { value: 'custom', label: 'Custom image' },
]
const POSITIONS = [
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
]

// The controls shown before recording starts.
export default function RecorderSetup({ settings, onChange, imageName, onImageChosen, hint, canStart, onStart }) {
  const fileInput = useRef(null)
  const cameraOn = settings.mode === 'screen_camera'

  return (
    <div className="card setup" data-testid="recorder-setup">
      <RadioGroup
        legend="Recording mode"
        name="mode"
        options={MODES}
        value={settings.mode}
        onChange={(mode) => onChange({ mode })}
      />

      <label className="choice toggle">
        <input
          type="checkbox"
          name="microphone"
          checked={settings.micOn}
          onChange={(e) => onChange({ micOn: e.target.checked })}
        />
        Microphone
      </label>

      {cameraOn && (
        <>
          <RadioGroup
            legend="Camera background"
            name="background"
            options={BACKGROUNDS}
            value={settings.background}
            onChange={(background) => onChange({ background })}
          />
          {settings.background === 'custom' && (
            <div className="choices">
              <button className="button" type="button" onClick={() => fileInput.current.click()}>
                Choose image
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                data-testid="background-image-input"
                onChange={(e) => {
                  if (e.target.files[0]) onImageChosen(e.target.files[0])
                  e.target.value = ''
                }}
              />
              {imageName && <span className="muted">{imageName}</span>}
            </div>
          )}

          <div className="field">
            <label htmlFor="bubble-position">Bubble position</label>
            <select
              id="bubble-position"
              name="position"
              value={settings.position}
              onChange={(e) => onChange({ position: e.target.value })}
            >
              {POSITIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {hint && <p className="hint">{hint}</p>}
      <button
        className="button primary large"
        type="button"
        disabled={!canStart}
        onClick={onStart}
        data-testid="start-recording-button"
      >
        Start recording
      </button>
    </div>
  )
}
