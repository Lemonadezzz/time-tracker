/**
 * Feature: Resume Work
 * Hook for resuming work after a break
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { useSessionStore } from '@/entities/session'
import { sessionApi } from '@/entities/session'
import { STORAGE_KEYS, TOAST_DURATIONS } from '@/shared/config/constants'

export const useResumeWork = () => {
  const [isLoading, setIsLoading] = useState(false)
  const {
    isTracking,
    isOnBreak,
    setOnBreak,
    setBreakTimeUsed,
    addCompletedBreak
  } = useSessionStore()

  const canResume = isTracking && isOnBreak

  const resumeWork = async () => {
    if (!canResume || isLoading) {
      return { success: false }
    }

    setIsLoading(true)

    try {
      const response = await sessionApi.resumeFromBreak()

      if (response.success) {
        // Update break time tracking
        setBreakTimeUsed(response.breakTimeUsed || 0)
        
        // Add completed break to history
        if (response.breakPeriods && response.breakPeriods.length > 0) {
          const lastBreak = response.breakPeriods[response.breakPeriods.length - 1]
          addCompletedBreak(lastBreak)
        }
        
        // End break state
        setOnBreak(false)

        // Notify other tabs
        localStorage.setItem(STORAGE_KEYS.SESSION_SYNC, Date.now().toString())

        toast.success("Work resumed", {
          description: "Timer resumed from break",
          duration: TOAST_DURATIONS.SHORT
        })

        return { success: true }
      }

      return { success: false }
    } catch (error) {
      toast.error("Failed to resume work", {
        description: "Please try again",
        duration: TOAST_DURATIONS.MEDIUM
      })
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    resumeWork,
    canResume,
    isLoading
  }
}
