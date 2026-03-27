/**
 * Application-wide constants
 */

export const TIME_CONSTANTS = {
  WORK_HOURS_START: 6, // 6 AM
  WORK_HOURS_END: 22, // 10 PM
  AUTO_STOP_HOUR: 23,
  AUTO_STOP_MINUTE: 59,
} as const

export const TIMELINE_CONSTANTS = {
  START_HOUR: 6,
  END_HOUR: 22,
  PIXELS_PER_MINUTE: 1,
  BAR_HEIGHT: 30,
  HOUR_MARKER_HEIGHT: 20,
} as const

export const API_ENDPOINTS = {
  SESSION: '/api/session',
  TIME_ENTRIES: '/api/time-entries',
  ACTION_LOGS: '/api/action-logs',
  USERS: '/api/users',
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  TIME_FORMAT: 'timeFormat',
  DATE_FORMAT: 'dateFormat',
  SESSION_SYNC: 'sessionSync',
} as const

export const TOAST_DURATIONS = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
} as const
