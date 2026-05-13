import React, { useState } from 'react'

export function CellConfig({ slotIndex, initialIp, initialLabel, onSave, onDelete, onCancel }) {
  const [ip, setIp] = useState(initialIp || '')
  const [label, setLabel] = useState(initialLabel || '')

  const handleSave = (e) => {
    e.preventDefault()
    const trimmed = ip.trim()
    if (!trimmed) return
    onSave({ ip: trimmed, label: label.trim() })
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Configure Connection {slotIndex + 1}</h2>
        <form onSubmit={handleSave}>
          <div className="modal-field">
            <label className="modal-label">IP Address</label>
            <input
              type="text"
              value={ip}
              onChange={e => setIp(e.target.value)}
              placeholder="192.168.1.100"
              className="ip-input"
              autoFocus
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Field 1"
              className="ip-input"
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="connect-button">Save</button>
            <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
            {initialIp && (
              <button type="button" onClick={onDelete} className="delete-button">Delete</button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
