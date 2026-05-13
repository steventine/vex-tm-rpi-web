import { useState, useEffect, useRef } from 'react'

export function useRpiPoller({ ip, active, targetFps }) {
  const [imageUrl, setImageUrl] = useState('')
  const [hasError, setHasError] = useState(false)
  const [fps, setFps] = useState(0)

  const shouldContinueRef = useRef(false)
  const isFetchingRef = useRef(false)
  const fetchTimeoutRef = useRef(null)
  const lastLoadTimeRef = useRef(null)
  const targetFpsRef = useRef(targetFps)

  // Update targetFps ref without restarting the loop
  useEffect(() => {
    targetFpsRef.current = targetFps
  }, [targetFps])

  useEffect(() => {
    if (!ip || !active) {
      shouldContinueRef.current = false
      isFetchingRef.current = false
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
      return
    }

    shouldContinueRef.current = true
    isFetchingRef.current = false
    lastLoadTimeRef.current = null
    setHasError(false)
    setFps(0)

    const url = `http://${ip}/screen.png`

    const doFetch = () => {
      if (!shouldContinueRef.current) return
      if (isFetchingRef.current) return

      isFetchingRef.current = true
      const fetchStart = Date.now()
      const imageUrlWithTimestamp = `${url}?t=${fetchStart}`
      const img = new Image()

      img.onload = () => {
        if (!shouldContinueRef.current) return
        setImageUrl(imageUrlWithTimestamp)
        setHasError(false)
        isFetchingRef.current = false

        const now = Date.now()
        if (lastLoadTimeRef.current !== null) {
          const diff = (now - lastLoadTimeRef.current) / 1000
          if (diff > 0) setFps(1 / diff)
        }
        lastLoadTimeRef.current = now

        const fetchDuration = now - fetchStart
        const delay = Math.max(0, 1000 / targetFpsRef.current - fetchDuration)
        fetchTimeoutRef.current = setTimeout(doFetch, delay)
      }

      img.onerror = () => {
        if (!shouldContinueRef.current) return
        setHasError(true)
        isFetchingRef.current = false
        fetchTimeoutRef.current = setTimeout(doFetch, 2000)
      }

      img.src = imageUrlWithTimestamp
    }

    doFetch()

    return () => {
      shouldContinueRef.current = false
      isFetchingRef.current = false
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
    }
  }, [ip, active])

  return { imageUrl, hasError, fps }
}
