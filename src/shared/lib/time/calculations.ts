/**
 * Time calculation utilities
 * Pure functions for duration and time calculations
 */

import { BreakPeriod } from '@/shared/types/common'
export type { BreakPeriod }

/**
 * Calculate work duration excluding break time
 * This is the CRITICAL calculation for accurate time tracking
 */
export const calculateWorkDuration = (
  sessionStart: Date,
  sessionEnd: Date,
  breakPeriods: BreakPeriod[]
): number => {
  const totalElapsed = Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / 1000)
  const totalBreakTime = breakPeriods.reduce((sum, period) => sum + period.duration, 0)
  
  return Math.max(0, totalElapsed - totalBreakTime)
}

/**
 * Calculate total break duration from break periods
 */
export const calculateTotalBreakTime = (breakPeriods: BreakPeriod[]): number => {
  return breakPeriods.reduce((sum, period) => sum + period.duration, 0)
}

/**
 * Calculate break duration between two dates
 */
export const calculateBreakDuration = (start: Date, end: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / 1000)
}

/**
 * Parse time string to Date object
 */
export const parseTimeString = (timeString: string, dateString: string): Date => {
  if (!dateString) {
    dateString = new Date().toLocaleDateString("en-CA")
  }
  
  const [hourMin, ampm] = timeString.split(" ")
  let [hour, minute] = hourMin.split(":").map(Number)

  if (ampm === "PM" && hour !== 12) {
    hour += 12
  } else if (ampm === "AM" && hour === 12) {
    hour = 0
  }

  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day, hour, minute, 0)
}

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toLocaleDateString('en-CA') === date2.toLocaleDateString('en-CA')
}

/**
 * Get seconds until end of day (11:59:59 PM)
 */
export const getSecondsUntilEndOfDay = (date: Date): number => {
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  return Math.floor((endOfDay.getTime() - date.getTime()) / 1000)
}
