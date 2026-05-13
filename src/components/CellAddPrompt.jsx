import React from 'react'

export function CellAddPrompt({ visible, onClick }) {
  return (
    <div
      className={`cell-add-prompt ${visible ? 'visible' : ''}`}
      onClick={onClick}
      title="Add Connection"
    >
      <span className="cell-add-icon">+</span>
      <span className="cell-add-text">Add Connection</span>
    </div>
  )
}
