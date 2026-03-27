/**
 * Feature: Stop Timer
 * Hook for stopping a work session
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { useSessionStore } from '@/entities/session'
import { sessionApi } from '@/entities/session'
import { timeEntryApi, CreateTimeEntryDto } from '@/entities/time-entry'
import { calculateWorkDuration } from '@/shared/lib/time'
import { formatTimerDisplay } from '@/shared/lib/time'
import { STORAGE_KEYS, TOAST_DURATIONS } from '@/shared/config/constants'

interface UseStopTimerProps {
  location: string
  onSuccess?: () => void
}

export const useStopTimer = ({ location, onSuccess }: UseStopTimerProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const {
    sessionStart,
    currentSessionTime,
    breakTimeUsed,
    completedBreakPeriods,
    resetSession
  } = useSessionStore()

  const stopTimer = async () => {
    if (!sessionStart || isLoading) {
      return { success: false }
    }

    setIsLoading(true)

    try {
      const now = new Date()
      const totalElapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
      const workDuration = totalElapsed - breakTimeUsed // CRITICAL: Exclude break time

      // Create time entry
      const newEntry: CreateTimeEntryDto = {
        date: now.toLocaleDateString("en-CA"),
        timeIn: sessionStart.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        }),
        timeOut: now.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: workDuration,
        location,
        breakPeriods: completedBreakPeriods
      }

      // Save entry
      await timeEntryApi.createEntry(newEntry)

      // Stop session (fire and forget)
      sessionApi.stopSession(location).catch(() => {})

      // Reset store
      resetSession()

      // Notify other tabs
      localStorage.setItem(STORAGE_KEYS.SESSION_SYNC, Date.now().toString())

      toast.success("Stopped working", {
        description: `Session duration: ${formatTimerDisplay(currentSessionTime)}`,
        duration: TOAST_DURATIONS.MEDIUM
      })

      onSuccess?.()

      return { success: true }
    } catch (error) {
      toast.error("Failed to stop timer", {
        description: "Please try again",
        duration: TOAST_DURATIONS.MEDIUM
      })
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    stopTimer,
    isLoading
  }
}
