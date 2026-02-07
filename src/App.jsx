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
  const isFetchingRef = useRef(false)
  const shouldContinueRef = useRef(false)
  const currentUrlRef = useRef('')
  const imgElementRef = useRef(null)

  // Load saved IP address on mount
  useEffect(() => {
    const savedIp = localStorage.getItem(IP_STORAGE_KEY)
    if (savedIp) {
      setIpAddress(savedIp)
      setDisplayIp(savedIp)
      startFetching(savedIp)
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
        setTimeout(() => fetchImage(url), 100)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (ipAddress.trim()) {
      // Save to localStorage
      localStorage.setItem(IP_STORAGE_KEY, ipAddress.trim())
      setDisplayIp(ipAddress.trim())
      startFetching(ipAddress.trim())
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
      <div className="display-container">
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
        <div className="controls">
          <button
            onClick={handleFullscreen}
            className="fullscreen-button"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '×' : '⤢'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App

