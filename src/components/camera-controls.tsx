import { CAMERA_CONTROLS } from '@/lib/lessons';
import type { CameraKey, CameraState } from '@/lib/types';

interface CameraControlsProps {
  state: CameraState;
  onChange: (key: CameraKey, value: number) => void;
}

export function CameraControls({ state, onChange }: CameraControlsProps) {
  return (
    <section className="panel controls-panel" aria-labelledby="controls-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CAMERA BODY</span>
          <h2 id="controls-title">Adjust your frame</h2>
        </div>
        <p className="controls-hint">Drag the view to pan</p>
      </div>
      <div className="controls-grid">
        {CAMERA_CONTROLS.map(([key, label, minimum, maximum, step, unit, buttonStep]) => (
          <label className="camera-control" key={key}>
            <span className="control-label">{label}<strong>{Number(state[key].toFixed(2))} {unit}</strong></span>
            <span className="slider-row">
              <button aria-label={`Decrease ${label}`} onClick={() => onChange(key, state[key] - buttonStep)} type="button">−</button>
              <input
                aria-label={label}
                max={maximum}
                min={minimum}
                onChange={(event) => onChange(key, Number(event.target.value))}
                step={step}
                type="range"
                value={state[key]}
              />
              <button aria-label={`Increase ${label}`} onClick={() => onChange(key, state[key] + buttonStep)} type="button">+</button>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}