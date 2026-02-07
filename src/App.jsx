import React, { useState, useEffect, useRef } from 'react'
import './App.css'

const IP_STORAGE_KEY = 'vex-tm-rpi-ip'

function App() {
  const [ipAddress, setIpAddress] = useState('')
  const [displayIp, setDisplayIp] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [fps, setFps] = useState(0)
  const isFetchingRef = useRef(false)
  const shouldContinueRef = useRef(false)
  const currentUrlRef = useRef('')
  const imgElementRef = useRef(null)
  const mouseTimeoutRef = useRef(null)
  const fetchTimeoutRef = useRef(null)
  const lastImageLoadTimeRef = useRef(null)

  // Load IP address from URL query parameter or localStorage on mount
  useEffect(() => {
    // Check for IP in URL query parameter first
    const urlParams = new URLSearchParams(window.location.search)
    const ipFromUrl = urlParams.get('ip')
    
    if (ipFromUrl) {
      // Use IP from URL and save it
      const trimmedIp = ipFromUrl.trim()
      setIpAddress(trimmedIp)
      setDisplayIp(trimmedIp)
      localStorage.setItem(IP_STORAGE_KEY, trimmedIp)
      startFetching(trimmedIp)
    } else {
      // Fall back to saved IP from localStorage
      const savedIp = localStorage.getItem(IP_STORAGE_KEY)
      if (savedIp) {
        setIpAddress(savedIp)
        setDisplayIp(savedIp)
        startFetching(savedIp)
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldContinueRef.current = false
    }
  }, [])

  const startFetching = (ip) => {
    // Stop any existing fetching
    shouldContinueRef.current = false
    isFetchingRef.current = false
    
    // Clear any pending fetch timeouts
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }
    
    // Reset FPS tracking
    setFps(0)
    lastImageLoadTimeRef.current = null
    
    setError('')
    const url = `http://${ip}/screen.png`
    currentUrlRef.current = url
    
    // Start continuous fetching
    shouldContinueRef.current = true
    fetchImage(url)
  }

  const fetchImage = async (url) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return
    }

    // Check if we should continue fetching
    if (!shouldContinueRef.current || currentUrlRef.current !== url) {
      return
    }

    try {
      isFetchingRef.current = true
      setIsLoading(true)
      
      // Create a new Image object to ensure complete loading before displaying
      const img = new Image()
      const imageUrlWithTimestamp = `${url}?t=${Date.now()}`
      
      // Wait for image to fully load before updating state
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Image is completely transferred, now update the display
          setImageUrl(imageUrlWithTimestamp)
          setIsLoading(false)
          setError('')
          isFetchingRef.current = false
          
          // Calculate FPS
          const now = Date.now()
          if (lastImageLoadTimeRef.current !== null) {
            const timeDiff = (now - lastImageLoadTimeRef.current) / 1000 // Convert to seconds
            if (timeDiff > 0) {
              const calculatedFps = 1 / timeDiff
              setFps(calculatedFps)
            }
          }
          lastImageLoadTimeRef.current = now
          
          resolve()
        }
        
        img.onerror = () => {
          setIsLoading(false)
          setError(`Failed to load image from ${url}. Please check the IP address and network connection.`)
          isFetchingRef.current = false
          reject(new Error('Image load failed'))
        }
        
        // Start loading the image with cache-busting timestamp
        img.src = imageUrlWithTimestamp
      })

      // Immediately fetch the next image if we should continue
      if (shouldContinueRef.current && currentUrlRef.current === url) {
        fetchImage(url)
      }
    } catch (err) {
      setIsLoading(false)
      isFetchingRef.current = false
      if (!error) {
        setError(`Error connecting to ${url}. Please verify the IP address and ensure the Raspberry Pi is accessible.`)
      }
      // Retry after a short delay on error to avoid hammering the server
      if (shouldContinueRef.current && currentUrlRef.current === url) {
        // Clear any existing timeout before setting a new one
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current)
        }
        fetchTimeoutRef.current = setTimeout(() => {
          fetchTimeoutRef.current = null
          fetchImage(url)
        }, 100)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (ipAddress.trim()) {
      const trimmedIp = ipAddress.trim()
      // Save to localStorage
      localStorage.setItem(IP_STORAGE_KEY, trimmedIp)
      setDisplayIp(trimmedIp)
      // Update URL with query parameter
      const url = new URL(window.location.href)
      url.searchParams.set('ip', trimmedIp)
      window.history.pushState({}, '', url)
      startFetching(trimmedIp)
    }
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }

  const handleChangeIp = () => {
    shouldContinueRef.current = false
    isFetchingRef.current = false
    // Clear any pending fetch timeouts
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }
    // Preserve the current IP address in the input field
    setIpAddress(displayIp)
    setDisplayIp('')
    setImageUrl('')
    setError('')
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Show controls on mouse movement, hide after inactivity
  useEffect(() => {
    if (!displayIp) return

    const handleMouseMove = () => {
      setShowControls(true)
      setShowCursor(true)  // Show cursor on movement
      
      // Clear existing timeout
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current)
      }
      
      // Hide controls and cursor after 2 seconds of inactivity
      mouseTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
        setShowCursor(false)  // Hide cursor after inactivity
      }, 2000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current)
      }
    }
  }, [displayIp])

  // If no IP is set, show input form
  if (!displayIp) {
    return (
      <div className="app-container">
        <div className="input-container">
          <h1>VEX TM RPi Remote Display</h1>
          <p>Enter the IP address of your VEX Tournament Manager Raspberry Pi</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="192.168.1.100"
              className="ip-input"
              autoFocus
            />
            <button type="submit" className="connect-button">
              Connect
            </button>
          </form>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className="app-container">
      <div className={`display-container ${!showCursor ? 'cursor-hidden' : ''}`}>
        {imageUrl && (
          <img
            ref={imgElementRef}
            src={imageUrl}
            alt="VEX TM Screen"
            className="screen-image"
            onError={() => {
              setError('Failed to display image. The connection may have been lost.')
            }}
          />
        )}
        {isLoading && !imageUrl && (
          <div className="loading-message">Loading...</div>
        )}
        {error && (
          <div className="error-overlay">
            <div className="error-message">{error}</div>
            <button
              onClick={() => {
                shouldContinueRef.current = false
                isFetchingRef.current = false
                // Clear any pending fetch timeouts
                if (fetchTimeoutRef.current) {
                  clearTimeout(fetchTimeoutRef.current)
                  fetchTimeoutRef.current = null
                }
                setDisplayIp('')
                setImageUrl('')
                setError('')
              }}
              className="retry-button"
            >
              Change IP Address
            </button>
          </div>
        )}
        <div className={`controls ${showControls ? 'visible' : 'hidden'}`}>
          <button
            onClick={handleChangeIp}
            className="config-button"
            title="Change IP Address"
          >
            ⚙
          </button>
          <button
            onClick={handleFullscreen}
            className="fullscreen-button"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '×' : '⤢'}
          </button>
        </div>
        {displayIp && (
          <div className={`fps-overlay ${showControls ? 'visible' : 'hidden'}`}>
            {fps.toFixed(1)} FPS
          </div>
        )}
      </div>
    </div>
  )
}

export default App

