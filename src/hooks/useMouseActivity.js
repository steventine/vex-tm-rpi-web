import { useState, useEffect, useRef } from 'react'

export function useMouseActivity(enabled = true) {
  const [showControls, setShowControls] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const handleMouseMove = () => {
      setShowControls(true)
      setShowCursor(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setShowControls(false)
        setShowCursor(false)
      }, 2000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [enabled])

  return { showControls, showCursor }
}
