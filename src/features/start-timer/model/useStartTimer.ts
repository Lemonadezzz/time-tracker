/**
 * Feature: Start Timer
 * Hook for starting a work session
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { useSessionStore } from '@/entities/session'
import { sessionApi } from '@/entities/session'
import { TIME_CONSTANTS, STORAGE_KEYS, TOAST_DURATIONS } from '@/shared/config/constants'

interface UseStartTimerProps {
  location: string
}

export const useStartTimer = ({ location }: UseStartTimerProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const { setTracking, setSessionStart, setCurrentSessionTime, setBreakTimeUsed, setPausedSessionTime, resetSession } = useSessionStore()

  const canStart = () => {
    const now = new Date()
    const hour = now.getHours()
    
    if (hour < TIME_CONSTANTS.WORK_HOURS_START || hour >= TIME_CONSTANTS.WORK_HOURS_END) {
      return {
        allowed: false,
        reason: `Work hours are ${TIME_CONSTANTS.WORK_HOURS_START}:00 AM - ${TIME_CONSTANTS.WORK_HOURS_END}:00 PM`
      }
    }
    
    return { allowed: true }
  }

  const startTimer = async () => {
    const validation = canStart()
    
    if (!validation.allowed) {
      toast.error("Cannot start timer", {
        description: validation.reason,
        duration: TOAST_DURATIONS.MEDIUM
      })
      return { success: false }
    }

    setIsLoading(true)

    try {
      const response = await sessionApi.startSession(location)

      if (response.success && response.sessionStart) {
        const sessionStartDate = new Date(response.sessionStart)
        
        // Update store
        resetSession()
        setSessionStart(sessionStartDate)
        setCurrentSessionTime(0)
        setBreakTimeUsed(0)
        setPausedSessionTime(0)
        setTracking(true)

        // Notify other tabs
        localStorage.setItem(STORAGE_KEYS.SESSION_SYNC, Date.now().toString())

        toast.success("Started working", {
          description: "Time tracking is now active",
          duration: TOAST_DURATIONS.SHORT
        })

        return { success: true, sessionStart: sessionStartDate }
      }

      return { success: false }
    } catch (error) {
      toast.error("Failed to start timer", {
        description: "Please try again",
        duration: TOAST_DURATIONS.MEDIUM
      })
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    startTimer,
    isLoading,
    canStart: canStart().allowed
  }
}
