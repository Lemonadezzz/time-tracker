/**
 * Common types used across the application
 */

export interface BreakPeriod {
  startTime: string
  endTime: string
  duration: number
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalEntries: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export type TimeFormat = '12' | '24'
export type DateFormat = 'US' | 'EU' | 'ISO'

export interface Location {
  locality: string
  region: string
  full: string
}
