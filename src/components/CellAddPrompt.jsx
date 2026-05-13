import React from 'react'

export function CellAddPrompt({ onClick }) {
  return (
    <div className="cell-add-prompt" onClick={onClick} title="Add Connection">
      <span className="cell-add-icon">+</span>
      <span className="cell-add-text">Add Connection</span>
    </div>
  )
}
