/**
 * Feature: Take Break
 * Hook for starting a break during active session
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { useSessionStore } from '@/entities/session'
import { sessionApi } from '@/entities/session'
import { STORAGE_KEYS, TOAST_DURATIONS } from '@/shared/config/constants'

export const useTakeBreak = () => {
  const [isLoading, setIsLoading] = useState(false)
  const {
    isTracking,
    currentSessionTime,
    setOnBreak,
    setPausedSessionTime
  } = useSessionStore()

  const canTakeBreak = isTracking

  const takeBreak = async () => {
    if (!canTakeBreak || isLoading) {
      return { success: false }
    }

    setIsLoading(true)

    try {
      const response = await sessionApi.startBreak()

      if (response.success) {
        // Store current work time as paused time
        setPausedSessionTime(currentSessionTime)
        setOnBreak(true)

        // Notify other tabs
        localStorage.setItem(STORAGE_KEYS.SESSION_SYNC, Date.now().toString())

        toast.success("Break started", {
          description: "Timer paused for break",
          duration: TOAST_DURATIONS.SHORT
        })

        return { success: true }
      }

      return { success: false }
    } catch (error: any) {
      toast.error("Failed to start break", {
        description: "Please try again",
        duration: TOAST_DURATIONS.MEDIUM
      })
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    takeBreak,
    canTakeBreak,
    isLoading
  }
}
