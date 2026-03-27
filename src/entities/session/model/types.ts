/**
 * Session Entity - Types
 * Represents an active work session
 */

import { BreakPeriod } from '@/shared/types/common'

export interface Session {
  id?: string
  userId: string
  startTime: Date
  endTime?: Date
  location: string
  isActive: boolean
  isOnBreak: boolean
  breakStartTime?: Date
  totalBreakTime: number
  breakPeriods: BreakPeriod[]
  createdAt: Date
}

export interface SessionState {
  isTracking: boolean
  isOnBreak: boolean
  sessionStart: Date | null
  breakStartTime: Date | null
  currentSessionTime: number
  pausedSessionTime: number
  breakTimeUsed: number
  breakTimeRemaining: number
  completedBreakPeriods: BreakPeriod[]
}

export interface SessionResponse {
  isTracking: boolean
  isOnBreak: boolean
  sessionStart: string | null
  currentBreakStart: string | null
  breakTimeUsed: number
  breakTimeRemaining: number
  breakPeriods: BreakPeriod[]
  autoResumed?: boolean
}

export interface SessionAction {
  action: 'start' | 'stop' | 'break' | 'resume'
  location?: string
}

export interface SessionActionResponse {
  success: boolean
  sessionStart?: string
  breakTimeUsed?: number
  breakTimeRemaining?: number
  breakPeriods?: BreakPeriod[]
  error?: string
}
