import React from 'react'

const LAYOUTS = [
  { key: '1',  label: '1×1', icon: '▣' },
  { key: '4',  label: '2×2', icon: '⊞' },
  { key: '16', label: '4×4', icon: '⊟' },
]

export function ControlsOverlay({
  visible,
  layout,
  isZoomed,
  isFullscreen,
  isGuest,
  onLayoutChange,
  onFullscreen,
  onSettingsOpen,
  onExitGuest,
}) {
  return (
    <div className={`controls ${visible ? 'visible' : 'hidden'}`}>
      {isGuest ? (
        <button onClick={onExitGuest} className="guest-exit-button" title="Exit Single RPi Mode">
          ✕ Exit Single RPi Mode
        </button>
      ) : (
        <div className="layout-switcher">
          {LAYOUTS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`layout-button ${layout === key && !isZoomed ? 'active' : ''}`}
              onClick={() => onLayoutChange(key)}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>
      )}
      <button onClick={onSettingsOpen} className="config-button" title="Settings">
        ⚙
      </button>
      <button
        onClick={onFullscreen}
        className="fullscreen-button"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? '×' : '⤢'}
      </button>
    </div>
  )
}
