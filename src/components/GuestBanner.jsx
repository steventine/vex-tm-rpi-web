import React from 'react'

export function GuestBanner({ ip, visible, onExit }) {
  return (
    <div className={`guest-banner ${visible ? 'visible' : 'hidden'}`}>
      <span className="guest-banner-text">Guest view: {ip}</span>
      <button onClick={onExit} className="guest-exit-button" title="Exit Guest Mode">
        Exit
      </button>
    </div>
  )
}
