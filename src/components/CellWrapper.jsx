import React, { useState } from 'react'
import { useRpiPoller } from '../hooks/useRpiPoller'
import { CellImage } from './CellImage'
import { CellAddPrompt } from './CellAddPrompt'
import { CellConfig } from './CellConfig'

export function CellWrapper({
  slotIndex,
  config,        // { ip, label } | null
  active,        // whether this cell should be polling
  targetFps,
  showLabelsAlways,
  isZoomable,    // true when in 4-up or 16-up and not already zoomed
  isZoomed,      // true when this cell is currently filling the screen via expand
  onZoom,
  onUnzoom,
  onConfigSave,  // (config | null) => void
}) {
  const [configOpen, setConfigOpen] = useState(false)

  const { imageUrl, hasError } = useRpiPoller({
    ip: config?.ip || null,
    active: active && !!config?.ip,
    targetFps,
  })

  const handleGearClick = (e) => {
    e.stopPropagation()
    setConfigOpen(true)
  }

  const handleExpandClick = (e) => {
    e.stopPropagation()
    onZoom()
  }

  const handleConfigSave = (newConfig) => {
    onConfigSave(newConfig)
    setConfigOpen(false)
  }

  const handleConfigDelete = () => {
    onConfigSave(null)
    setConfigOpen(false)
  }

  const cellClasses = [
    'cell',
    !config ? 'unconfigured' : '',
    config && hasError ? 'has-error' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <div className={cellClasses}>
        {config ? (
          <>
            <CellImage imageUrl={imageUrl} />
            {!imageUrl && !hasError && (
              <div className="cell-loading">Connecting...</div>
            )}
            {hasError && (
              <div className="cell-error">
                <span>Connection failed</span>
                <span className="cell-error-ip">{config.ip}</span>
              </div>
            )}
            {config.label && (
              <div className={`cell-label ${showLabelsAlways ? '' : 'hover-visible'}`}>
                {config.label}
              </div>
            )}
            <div className="cell-controls">
              {isZoomable && (
                <button className="cell-expand" onClick={handleExpandClick} title="Expand to full screen">
                  <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="8" cy="8" r="5"/>
                    <line x1="12.5" y1="12.5" x2="18" y2="18"/>
                    <line x1="5.5" y1="8" x2="10.5" y2="8"/>
                    <line x1="8" y1="5.5" x2="8" y2="10.5"/>
                  </svg>
                </button>
              )}
              {isZoomed && (
                <button className="cell-expand" onClick={(e) => { e.stopPropagation(); onUnzoom() }} title="Return to grid">
                  <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="8" cy="8" r="5"/>
                    <line x1="12.5" y1="12.5" x2="18" y2="18"/>
                    <line x1="5.5" y1="8" x2="10.5" y2="8"/>
                  </svg>
                </button>
              )}
              <button className="cell-gear" onClick={handleGearClick} title="Configure">
                ⚙
              </button>
            </div>
          </>
        ) : (
          <CellAddPrompt onClick={() => setConfigOpen(true)} />
        )}
      </div>

      {configOpen && (
        <CellConfig
          slotIndex={slotIndex}
          initialIp={config?.ip || ''}
          initialLabel={config?.label || ''}
          onSave={handleConfigSave}
          onDelete={handleConfigDelete}
          onCancel={() => setConfigOpen(false)}
        />
      )}
    </>
  )
}
