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
const END_HOUR = 22 // 10 PM (22:00)
const TOTAL_HOURS = END_HOUR - START_HOUR
const MINUTES_PER_HOUR = 60
const TOTAL_MINUTES = TOTAL_HOURS * MINUTES_PER_HOUR
const PIXELS_PER_MINUTE = 1 // Reduced from 2 to 1 to shorten the timeline
const TIMELINE_WIDTH = TOTAL_MINUTES * PIXELS_PER_MINUTE // Total width of the timeline in pixels
const HOUR_MARKER_HEIGHT = 20 // Height for hour labels
const BAR_HEIGHT = 30 // Height of the green highlight bars

export default function DayTimeline({ entries }: DayTimelineProps) {
  const now = new Date()
  const todayDateString = now.toLocaleDateString("en-CA") // YYYY-MM-DD

  // Generate hourly markers for even numbers only
  const hoursToDisplay = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i).filter(
    (hour) => hour % 2 === 0, // Filter for even hours
  )

  const formatHourLabel = (hour: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const ampm = hour >= 12 ? "PM" : "AM"
    return `${displayHour}${ampm}`
  }

  // Filter entries for today and ensure they have timeOut
  const todayCompletedEntries = entries.filter((entry) => entry.date === todayDateString && entry.timeOut !== null)

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

  if (todayCompletedEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No completed time entries for today to display on the timeline.</p>
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

        {/* Time Entry Highlights */}
        {todayCompletedEntries.map((entry) => {
          const timeInDate = parseTime(entry.timeIn, entry.date)
          const timeOutDate = entry.timeOut ? parseTime(entry.timeOut, entry.date) : null

          if (!timeOutDate) return null // Only show completed entries

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
              title={`Time In: ${entry.timeIn}, Time Out: ${entry.timeOut}, Duration: ${Math.floor(entry.duration / 60)}m`}
            >
              <span className="sr-only">
                Time In: {entry.timeIn}, Time Out: {entry.timeOut}, Duration: {Math.floor(entry.duration / 60)} minutes
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
