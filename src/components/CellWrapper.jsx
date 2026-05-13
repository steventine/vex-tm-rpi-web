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
  onZoom,
  onConfigSave,  // (config | null) => void
}) {
  const [configOpen, setConfigOpen] = useState(false)

  const { imageUrl, hasError } = useRpiPoller({
    ip: config?.ip || null,
    active: active && !!config?.ip,
    targetFps,
  })

  const handleCellClick = () => {
    if (isZoomable && config) onZoom()
  }

  const handleGearClick = (e) => {
    e.stopPropagation()
    setConfigOpen(true)
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
    isZoomable && config ? 'zoomable' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <div className={cellClasses} onClick={handleCellClick}>
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
            <button className="cell-gear" onClick={handleGearClick} title="Configure">
              ⚙
            </button>
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
