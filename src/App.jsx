import React, { useState } from 'react'
import './App.css'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useMouseActivity } from './hooks/useMouseActivity'
import { useFullscreen } from './hooks/useFullscreen'
import { DashboardGrid } from './components/DashboardGrid'
import { ControlsOverlay } from './components/ControlsOverlay'
import { GlobalSettings } from './components/GlobalSettings'

const DEFAULT_SLOTS = Array(16).fill(null)

function App() {
  const [slots, setSlots] = useLocalStorage('vex-slots', DEFAULT_SLOTS)
  const [layout, setLayout] = useLocalStorage('vex-layout', '1')
  const [globalFps, setGlobalFps] = useLocalStorage('vex-fps', 10)
  const [showLabelsAlways, setShowLabelsAlways] = useLocalStorage('vex-show-labels', false)

  const [zoomedSlot, setZoomedSlot] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Guest mode: ?ip= param — session only, never touches localStorage
  const [guestIp] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('ip') || null
  })

  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const { showControls, showCursor } = useMouseActivity(true)

  // Validate slots from localStorage
  const safeSlots = Array.isArray(slots) && slots.length === 16 ? slots : DEFAULT_SLOTS

  const handleSlotChange = (index, config) => {
    setSlots(prev => {
      const next = [...prev]
      next[index] = config
      return next
    })
  }

  const handleLayoutChange = (newLayout) => {
    // If zoomed, clicking any layout clears zoom and switches layout
    setZoomedSlot(null)
    setLayout(newLayout)
  }

  const handleZoom = (slotIndex) => {
    setZoomedSlot(slotIndex)
  }

  const handleUnzoom = () => {
    setZoomedSlot(null)
  }

  const handleSettingsSave = (fps, labelsAlways) => {
    setGlobalFps(fps)
    setShowLabelsAlways(labelsAlways)
    setSettingsOpen(false)
  }

  const handleExitGuest = () => {
    window.history.replaceState({}, '', window.location.pathname)
    window.location.reload()
  }

  // Guest mode: render a single guest cell
  if (guestIp) {
    const guestSlots = [{ ip: guestIp, label: '' }, ...Array(15).fill(null)]
    return (
      <div className={`app-root ${!showCursor ? 'cursor-hidden' : ''}`}>
        <DashboardGrid
          layout="1"
          slots={guestSlots}
          zoomedSlot={null}
          globalFps={globalFps}
          showLabelsAlways={showLabelsAlways}
          onZoom={() => {}}
          onSlotChange={() => {}}
        />
        <ControlsOverlay
          visible={showControls}
          layout="1"
          isZoomed={false}
          isFullscreen={isFullscreen}
          isGuest={true}
          onLayoutChange={() => {}}
          onFullscreen={toggleFullscreen}
          onSettingsOpen={() => setSettingsOpen(true)}
          onExitGuest={handleExitGuest}
        />
        {settingsOpen && (
          <GlobalSettings
            fps={globalFps}
            showLabelsAlways={showLabelsAlways}
            onSave={handleSettingsSave}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`app-root ${!showCursor ? 'cursor-hidden' : ''}`}>
      <DashboardGrid
        layout={layout}
        slots={safeSlots}
        zoomedSlot={zoomedSlot}
        globalFps={globalFps}
        showLabelsAlways={showLabelsAlways}
        onZoom={handleZoom}
        onUnzoom={handleUnzoom}
        onSlotChange={handleSlotChange}
      />
      <ControlsOverlay
        visible={showControls}
        layout={layout}
        isZoomed={zoomedSlot !== null}
        isFullscreen={isFullscreen}
        onLayoutChange={handleLayoutChange}
        onFullscreen={toggleFullscreen}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      {settingsOpen && (
        <GlobalSettings
          fps={globalFps}
          showLabelsAlways={showLabelsAlways}
          onSave={handleSettingsSave}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export default App
