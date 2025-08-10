import { TimeEntry } from '../types'

export const timeTrackerService = {
  clearStorage: () => {
    localStorage.removeItem("timeEntries")
    localStorage.removeItem("isTracking")
    localStorage.removeItem("currentSessionStart")
  },

  getEntries: (): TimeEntry[] => {
    const saved = localStorage.getItem("timeEntries")
    return saved ? JSON.parse(saved) : []
  },

  saveEntries: (entries: TimeEntry[]) => {
    localStorage.setItem("timeEntries", JSON.stringify(entries))
  },

  getTrackingState: () => {
    return {
      isTracking: localStorage.getItem("isTracking") === "true",
      sessionStart: localStorage.getItem("currentSessionStart")
    }
  },

  saveTrackingState: (isTracking: boolean, sessionStart?: string) => {
    if (isTracking && sessionStart) {
      localStorage.setItem("isTracking", "true")
      localStorage.setItem("currentSessionStart", sessionStart)
    } else {
      localStorage.removeItem("isTracking")
      localStorage.removeItem("currentSessionStart")
    }
  }
}