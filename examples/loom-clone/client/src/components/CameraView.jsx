import RadioGroup from './RadioGroup.jsx'

const VIEWS = [
  { value: 'show', label: 'Show' },
  { value: 'dim', label: 'Dim' },
  { value: 'hide', label: 'Hide' },
]
const SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

// The live camera view on the recorder page, with the controls for how it is
// shown. It stays on the page before and during a recording.
//
// "Dim", "Hide" and "Camera view size" only change this page: they are plain
// page elements and CSS laid over (or around) the canvas. The canvas picture
// itself, which is what gets recorded, is never touched, and the canvas stays
// in the page when hidden so the camera keeps running.
export default function CameraView({ canvasRef, mode, settings, onChange, recording }) {
  const cameraOnly = mode === 'camera'
  const shape = cameraOnly ? `rect size-${settings.viewSize}` : 'round'

  return (
    <div className="camera-area">
      <div className={`camera-view ${shape}`} data-testid="camera-view">
        <canvas
          ref={canvasRef}
          className="camera-preview"
          width="640"
          height="480"
          aria-label="Camera preview"
          data-testid="camera-preview"
        />
        {settings.cameraView === 'dim' && <div className="camera-dim" data-testid="camera-dim" />}
        {settings.cameraView === 'hide' && (
          <div className="camera-hidden" data-testid="camera-hidden">
            <span>Camera hidden</span>
            {recording && <span className="camera-hidden-note">still recording</span>}
          </div>
        )}
      </div>

      <RadioGroup
        legend="Camera view"
        name="cameraView"
        options={VIEWS}
        value={settings.cameraView}
        onChange={(cameraView) => onChange({ cameraView })}
      />
      {cameraOnly && (
        <RadioGroup
          legend="Camera view size"
          name="viewSize"
          options={SIZES}
          value={settings.viewSize}
          onChange={(viewSize) => onChange({ viewSize })}
        />
      )}
    </div>
  )
}
