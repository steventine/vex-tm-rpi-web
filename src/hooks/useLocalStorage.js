import { useState, useCallback } from 'react'

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored === null) return defaultValue
      return JSON.parse(stored)
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }, [key])

  return [value, setStoredValue]
}
