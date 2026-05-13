import React from 'react'
import { CellWrapper } from './CellWrapper'

// Maps layout string to how many slots are visible
const LAYOUT_SLOT_COUNT = { '1': 1, '4': 4, '16': 16 }

export function DashboardGrid({
  layout,
  slots,
  zoomedSlot,
  globalFps,
  showLabelsAlways,
  onZoom,
  onSlotChange,
}) {
  const isZoomed = zoomedSlot !== null
  const slotCount = isZoomed ? 1 : LAYOUT_SLOT_COUNT[layout] || 1

  // Which slot indices are visible
  const visibleIndices = isZoomed
    ? [zoomedSlot]
    : Array.from({ length: slotCount }, (_, i) => i)

  // FPS budget: split evenly across configured visible cells
  const configuredCount = visibleIndices.filter(i => slots[i] !== null).length
  const perCellFps = configuredCount > 0 ? globalFps / configuredCount : globalFps

  const gridClass = isZoomed
    ? 'dashboard-grid layout-zoomed'
    : `dashboard-grid layout-${layout}`

  return (
    <div className={gridClass}>
      {visibleIndices.map(slotIndex => (
        <CellWrapper
          key={slotIndex}
          slotIndex={slotIndex}
          config={slots[slotIndex]}
          active={true}
          targetFps={perCellFps}
          showLabelsAlways={showLabelsAlways}
          isZoomable={!isZoomed && layout !== '1'}
          onZoom={() => onZoom(slotIndex)}
          onConfigSave={(config) => onSlotChange(slotIndex, config)}
        />
      ))}
    </div>
  )
}
