/**
 * Session Entity - State Management
 * Zustand store for session state
 */

import { create } from 'zustand'
import { SessionState } from './types'

interface SessionStore extends SessionState {
  // Actions
  setTracking: (isTracking: boolean) => void
  setSessionStart: (start: Date | null) => void
  setCurrentSessionTime: (time: number) => void
  resetSession: () => void
  initializeSession: (data: { sessionStart: Date }) => void
}

const initialState: SessionState = {
  isTracking: false,
  sessionStart: null,
  currentSessionTime: 0,
}

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setTracking: (isTracking) => set({ isTracking }),

  setSessionStart: (sessionStart) => set({ sessionStart }),

  setCurrentSessionTime: (currentSessionTime) => set({ currentSessionTime }),

  resetSession: () => set({ ...initialState }),

  initializeSession: (data) => {
    const { sessionStart } = data
    const now = new Date()
    const totalElapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
    set({
      isTracking: true,
      sessionStart,
      currentSessionTime: Math.max(0, totalElapsed),
    })
  }
}))
