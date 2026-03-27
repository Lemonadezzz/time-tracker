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
    isOnBreak,
    sessionStart,
    currentSessionTime,
    breakTimeUsed,
    pausedSessionTime,
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
            sessionStart: new Date(data.sessionStart),
            isOnBreak: data.isOnBreak,
            breakTimeUsed: data.breakTimeUsed,
            breakTimeRemaining: data.breakTimeRemaining,
            currentBreakStart: data.currentBreakStart ? new Date(data.currentBreakStart) : undefined
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
      if (isOnBreak) {
        // During break, keep timer frozen at paused time
        setCurrentSessionTime(pausedSessionTime)
      } else {
        // Not on break: calculate work time from session start minus break time
        const now = new Date()
        const totalElapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
        const workTime = totalElapsed - breakTimeUsed
        setCurrentSessionTime(Math.max(0, workTime))
      }

      // Auto-stop at 11:59 PM
      const now = new Date()
      if (now.getHours() === TIME_CONSTANTS.AUTO_STOP_HOUR && 
          now.getMinutes() >= TIME_CONSTANTS.AUTO_STOP_MINUTE) {
        const stopBtn = document.getElementById('stop-tracking-btn')
        if (stopBtn) stopBtn.click()
        return false
      }
      return true
    }

    // Calculate immediately
    calculateTime()

    // Then set up interval
    const interval = setInterval(() => {
      if (!calculateTime()) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
    // setCurrentSessionTime is a stable Zustand action reference — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, sessionStart, isOnBreak, breakTimeUsed, pausedSessionTime])

  return {
    isTracking,
    isOnBreak,
    sessionStart,
    currentSessionTime
  }
}
