"use client"

import { Clock } from "lucide-react"

interface TimeEntry {
  id: string
  date: string // YYYY-MM-DD
  timeIn: string // HH:MM AM/PM
  timeOut: string | null // HH:MM AM/PM
  duration: number // in seconds
}

interface DayTimelineProps {
  entries: TimeEntry[]
}

const START_HOUR = 6 // 6 AM
const END_HOUR = 22 // 10 PM (22:00) - timeline ends at 10 PM sharp
const TOTAL_HOURS = END_HOUR - START_HOUR
const MINUTES_PER_HOUR = 60
const TOTAL_MINUTES = TOTAL_HOURS * MINUTES_PER_HOUR
const PIXELS_PER_MINUTE = 1 // Reduced from 2 to 1 to shorten the timeline
const TIMELINE_WIDTH = TOTAL_MINUTES * PIXELS_PER_MINUTE // Total width of the timeline in pixels
const HOUR_MARKER_HEIGHT = 20 // Height for hour labels
const BAR_HEIGHT = 30 // Height of the green highlight bars

export default function DayTimeline({ entries }: DayTimelineProps) {
  // Use the date from entries instead of hardcoded today
  const entryDate = entries.length > 0 ? entries[0].date : new Date().toLocaleDateString("en-CA")

  const formatTime = (timeStr: string) => {
    if (!timeStr) return timeStr
    const userFormat = localStorage.getItem('timeFormat') || '12'
    
    if (userFormat === '24') {
      // Convert to 24-hour format if needed
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [hourMin, ampm] = timeStr.split(' ')
        let [hour, minute] = hourMin.split(':').map(Number)
        if (ampm === 'PM' && hour !== 12) hour += 12
        if (ampm === 'AM' && hour === 12) hour = 0
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }
      return timeStr
    } else {
      // Convert to 12-hour format if needed
      if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
      const [hour, minute] = timeStr.split(':')
      const hourNum = parseInt(hour)
      const ampm = hourNum >= 12 ? 'PM' : 'AM'
      const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
      return `${hour12}:${minute} ${ampm}`
    }
  }

  // Generate hourly markers for even numbers only
  const hoursToDisplay = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i).filter(
    (hour) => hour % 2 === 0, // Filter for even hours
  )

  const formatHourLabel = (hour: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const ampm = hour >= 12 ? "PM" : "AM"
    return `${displayHour}${ampm}`
  }

  // Filter entries for the specific date - include live sessions (timeOut === null)
  const validEntries = entries.filter((entry) => entry.date === entryDate)
  const completedEntries = validEntries.filter((entry) => entry.timeOut !== null)
  const liveEntries = validEntries.filter((entry) => entry.timeOut === null)

  const parseTime = (timeString: string, dateString: string): Date => {
    // Combine date and time string to create a full Date object in local timezone
    const [hourMin, ampm] = timeString.split(" ")
    let [hour, minute] = hourMin.split(":").map(Number)

    if (ampm === "PM" && hour !== 12) {
      hour += 12
    } else if (ampm === "AM" && hour === 12) {
      hour = 0 // 12 AM is 00:00
    }

    const [year, month, day] = dateString.split("-").map(Number)
    // Use local date constructor
    return new Date(year, month - 1, day, hour, minute, 0)
  }

  if (completedEntries.length === 0 && liveEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No time entries for this date to display on the timeline.</p>
      </div>
    )
  }

  return (
    <div className="relative border rounded-lg p-4 overflow-x-auto">
      <div className="relative h-[70px]" style={{ width: `${TIMELINE_WIDTH}px` }}>
        {/* Hourly markers (even numbers only) */}
        {hoursToDisplay.map((hour) => {
          const positionMinutes = (hour - START_HOUR) * MINUTES_PER_HOUR
          const leftPosition = positionMinutes * PIXELS_PER_MINUTE
          return (
            <div
              key={hour}
              className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" // Vertical line
              style={{ left: `${leftPosition}px` }}
            >
              <span className="absolute top-[-20px] left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                {formatHourLabel(hour)}
              </span>
            </div>
          )
        })}

        {/* Completed Time Entry Highlights */}
        {completedEntries.map((entry) => {
          const timeInDate = parseTime(entry.timeIn, entry.date)
          let timeOutDate = entry.timeOut ? parseTime(entry.timeOut, entry.date) : null

          if (!timeOutDate) return null // Only show completed entries

          // Cap timeOut to 10 PM if it goes beyond
          if (timeOutDate.getHours() >= 22) {
            timeOutDate = new Date(timeOutDate.getFullYear(), timeOutDate.getMonth(), timeOutDate.getDate(), 22, 0, 0)
          }

          // Calculate start and end minutes from 6 AM
          const startMinutesFromDayStart =
            (timeInDate.getHours() - START_HOUR) * MINUTES_PER_HOUR + timeInDate.getMinutes()
          const endMinutesFromDayStart =
            (timeOutDate.getHours() - START_HOUR) * MINUTES_PER_HOUR + timeOutDate.getMinutes()

          // Clip to timeline bounds (0 to TOTAL_MINUTES)
          const clippedStartMinutes = Math.max(0, startMinutesFromDayStart)
          const clippedEndMinutes = Math.min(TOTAL_MINUTES, endMinutesFromDayStart)

          if (clippedStartMinutes >= clippedEndMinutes) return null // Entry is completely outside or invalid

          const leftPosition = clippedStartMinutes * PIXELS_PER_MINUTE
          const width = (clippedEndMinutes - clippedStartMinutes) * PIXELS_PER_MINUTE

          return (
            <div
              key={entry.id}
              className="absolute bg-green-500/30 rounded-sm border border-green-600/50"
              style={{
                left: `${leftPosition}px`,
                width: `${width}px`,
                height: `${BAR_HEIGHT}px`, // Fixed height for the bar
                top: `${HOUR_MARKER_HEIGHT + 10}px`, // Position below hour labels with some padding
              }}
              title={`Time In: ${formatTime(entry.timeIn)}, Time Out: ${formatTime(entry.timeOut)}, Duration: ${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m`}
            >
              <span className="sr-only">
                Time In: {formatTime(entry.timeIn)}, Time Out: {formatTime(entry.timeOut)}, Duration: {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
              </span>
            </div>
          )
        })}

        {/* Live Session Highlights */}
        {liveEntries.map((entry) => {
          const timeInDate = parseTime(entry.timeIn, entry.date)
          const currentTime = new Date()
          
          // Calculate start minutes from 6 AM
          const startMinutesFromDayStart =
            (timeInDate.getHours() - START_HOUR) * MINUTES_PER_HOUR + timeInDate.getMinutes()
          
          // Calculate current end minutes (live session)
          const endMinutesFromDayStart =
            (currentTime.getHours() - START_HOUR) * MINUTES_PER_HOUR + currentTime.getMinutes()

          // Clip to timeline bounds
          const clippedStartMinutes = Math.max(0, startMinutesFromDayStart)
          const clippedEndMinutes = Math.min(TOTAL_MINUTES, endMinutesFromDayStart)

          if (clippedStartMinutes >= clippedEndMinutes) return null

          const leftPosition = clippedStartMinutes * PIXELS_PER_MINUTE
          const width = (clippedEndMinutes - clippedStartMinutes) * PIXELS_PER_MINUTE

          return (
            <div
              key={entry.id}
              className="absolute bg-green-500/50 rounded-sm border border-green-600 animate-pulse"
              style={{
                left: `${leftPosition}px`,
                width: `${width}px`,
                height: `${BAR_HEIGHT}px`,
                top: `${HOUR_MARKER_HEIGHT + 10}px`,
              }}
              title={`Currently tracking since ${formatTime(entry.timeIn)}`}
            >
              <span className="sr-only">
                Currently tracking since {formatTime(entry.timeIn)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
