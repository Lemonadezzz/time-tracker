import { TimeEntry } from '../types'

export const formatTimerDisplay = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export const getFilteredEntries = (entries: TimeEntry[], period: string): TimeEntry[] => {
  const now = new Date()
  const today = now.toLocaleDateString("en-CA")

  switch (period) {
    case "today":
      return entries.filter((entry) => entry.date === today)
    case "week":
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      const weekStartStr = weekStart.toLocaleDateString("en-CA")
      return entries.filter((entry) => entry.date >= weekStartStr)
    case "month":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthStartStr = monthStart.toLocaleDateString("en-CA")
      return entries.filter((entry) => entry.date >= monthStartStr)
    default:
      return entries
  }
}

export const getTotalTime = (entries: TimeEntry[]): number => {
  return entries.reduce((total, entry) => total + entry.duration, 0)
}