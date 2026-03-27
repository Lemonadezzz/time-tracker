/**
 * Session Entity - State Management
 * Zustand store for session state
 */

import { create } from 'zustand'
import { SessionState } from './types'
import { BreakPeriod } from '@/shared/types/common'

interface SessionStore extends SessionState {
  // Actions
  setTracking: (isTracking: boolean) => void
  setOnBreak: (isOnBreak: boolean) => void
  setSessionStart: (start: Date | null) => void
  setBreakStartTime: (time: Date | null) => void
  setCurrentSessionTime: (time: number) => void
  setPausedSessionTime: (time: number) => void
  setBreakTimeUsed: (time: number) => void
  setBreakTimeRemaining: (time: number) => void
  addCompletedBreak: (breakPeriod: BreakPeriod) => void
  resetSession: () => void
  initializeSession: (data: {
    sessionStart: Date
    isOnBreak: boolean
    breakTimeUsed: number
    breakTimeRemaining: number
    currentBreakStart?: Date
  }) => void
}

const initialState: SessionState = {
  isTracking: false,
  isOnBreak: false,
  sessionStart: null,
  breakStartTime: null,
  currentSessionTime: 0,
  pausedSessionTime: 0,
  breakTimeUsed: 0,
  breakTimeRemaining: 0,
  completedBreakPeriods: []
}

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setTracking: (isTracking) => set({ isTracking }),

  setOnBreak: (isOnBreak) => set({ isOnBreak }),

  setSessionStart: (sessionStart) => set({ sessionStart }),

  setBreakStartTime: (breakStartTime) => set({ breakStartTime }),

  setCurrentSessionTime: (currentSessionTime) => set({ currentSessionTime }),

  setPausedSessionTime: (pausedSessionTime) => set({ pausedSessionTime }),

  setBreakTimeUsed: (breakTimeUsed) => set({ breakTimeUsed }),

  setBreakTimeRemaining: (breakTimeRemaining) => set({ breakTimeRemaining }),

  addCompletedBreak: (breakPeriod) => set((state) => ({
    completedBreakPeriods: [...state.completedBreakPeriods, breakPeriod]
  })),

  resetSession: () => set({ ...initialState }),

  initializeSession: (data) => {
    const { sessionStart, isOnBreak, breakTimeUsed, breakTimeRemaining, currentBreakStart } = data
    const now = new Date()
    const totalElapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)

    if (isOnBreak && currentBreakStart) {
      // Currently on break - calculate work time before break started
      const workTimeBeforeBreak = Math.floor((currentBreakStart.getTime() - sessionStart.getTime()) / 1000) - breakTimeUsed
      set({
        isTracking: true,
        isOnBreak: true,
        sessionStart,
        breakStartTime: currentBreakStart,
        currentSessionTime: Math.max(0, workTimeBeforeBreak),
        pausedSessionTime: Math.max(0, workTimeBeforeBreak),
        breakTimeUsed,
        breakTimeRemaining
      })
    } else {
      // Not on break - calculate current work time
      const workTime = totalElapsed - breakTimeUsed
      set({
        isTracking: true,
        isOnBreak: false,
        sessionStart,
        breakStartTime: null,
        currentSessionTime: Math.max(0, workTime),
        pausedSessionTime: 0,
        breakTimeUsed,
        breakTimeRemaining
      })
    }
  }
}))
