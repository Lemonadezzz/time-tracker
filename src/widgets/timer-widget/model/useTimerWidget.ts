/**
 * Timer Widget - Business Logic
 * Manages timer state and updates
 */

import { useEffect } from 'react'
import { useSessionStore } from '@/entities/session'
import { sessionApi } from '@/entities/session'
import { TIME_CONSTANTS } from '@/shared/config/constants'

export const useTimerWidget = () => {
  const {
    isTracking,
    sessionStart,
    currentSessionTime,
    setCurrentSessionTime,
    initializeSession
  } = useSessionStore()

  // Load active session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await sessionApi.getActiveSession()
        
        if (data.isTracking && data.sessionStart) {
          initializeSession({
            sessionStart: new Date(data.sessionStart)
          })
        }
      } catch (error) {
        console.error('Failed to load session:', error)
      }
    }

    loadSession()
  }, [])

  // Timer effect - Update every second when tracking
  useEffect(() => {
    if (!isTracking || !sessionStart) return

    const calculateTime = () => {
      const now = new Date()
      const totalElapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
      setCurrentSessionTime(Math.max(0, totalElapsed))

      // Auto-stop at 11:59 PM
      if (now.getHours() === TIME_CONSTANTS.AUTO_STOP_HOUR && 
          now.getMinutes() >= TIME_CONSTANTS.AUTO_STOP_MINUTE) {
        const stopBtn = document.getElementById('stop-tracking-btn')
        if (stopBtn) stopBtn.click()
        return false
      }
      return true
    }

    calculateTime()

    const interval = setInterval(() => {
      if (!calculateTime()) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, sessionStart])

  return {
    isTracking,
    sessionStart,
    currentSessionTime
  }
}
