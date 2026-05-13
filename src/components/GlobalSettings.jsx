import React, { useState } from 'react'

export function GlobalSettings({ fps, showLabelsAlways, onSave, onClose }) {
  const [fpsValue, setFpsValue] = useState(fps)
  const [labelsAlways, setLabelsAlways] = useState(showLabelsAlways)

  const handleSave = (e) => {
    e.preventDefault()
    onSave(fpsValue, labelsAlways)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Settings</h2>
        <form onSubmit={handleSave}>
          <div className="modal-field">
            <label className="modal-label">
              Max FPS Budget: <strong>{fpsValue}</strong>
            </label>
            <input
              type="range"
              min="1"
              max="16"
              value={fpsValue}
              onChange={e => setFpsValue(Number(e.target.value))}
              className="fps-slider"
            />
            <div className="fps-slider-labels">
              <span>1</span>
              <span>16</span>
            </div>
            <p className="modal-hint">
              FPS is split equally across active cells. In 4-up with 4 cells: {Math.round(fpsValue / 4 * 10) / 10} FPS each.
            </p>
          </div>
          <div className="modal-field modal-checkbox-field">
            <label className="modal-checkbox-label">
              <input
                type="checkbox"
                checked={labelsAlways}
                onChange={e => setLabelsAlways(e.target.checked)}
                className="modal-checkbox"
              />
              Show labels always (otherwise on hover)
            </label>
          </div>
          <div className="modal-actions">
            <button type="submit" className="connect-button">Save</button>
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
