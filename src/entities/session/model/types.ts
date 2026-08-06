/**
 * Session Entity - Types
 * Represents an active work session
 */

export interface Session {
  id?: string
  userId: string
  startTime: Date
  endTime?: Date
  location: string
  isActive: boolean
  createdAt: Date
}

export interface SessionState {
  isTracking: boolean
  sessionStart: Date | null
  currentSessionTime: number
}

export interface SessionResponse {
  isTracking: boolean
  sessionStart: string | null
}

export interface SessionAction {
  action: 'start' | 'stop'
  location?: string
}

export interface SessionActionResponse {
  success: boolean
  sessionStart?: string
  error?: string
}
