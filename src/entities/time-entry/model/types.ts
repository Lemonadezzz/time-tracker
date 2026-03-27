/**
 * TimeEntry Entity - Types
 * Represents a completed work session
 */

import { BreakPeriod } from '@/shared/types/common'

export interface TimeEntry {
  _id?: string
  userId?: string
  date: string // YYYY-MM-DD
  timeIn: string // HH:MM AM/PM
  timeOut: string | null // HH:MM AM/PM
  duration: number // in seconds (work time only, excludes breaks)
  location?: string
  breakPeriods?: BreakPeriod[]
  createdAt?: Date
  updatedAt?: Date
}

export interface ConsolidatedTimeEntry extends TimeEntry {
  entries?: TimeEntry[]
  totalDuration: number
}

export interface CreateTimeEntryDto {
  date: string
  timeIn: string
  timeOut: string
  duration: number
  location: string
  breakPeriods: BreakPeriod[]
}
