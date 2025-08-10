"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Play, Square, Calendar } from "lucide-react"
import DayTimeline from "./day-timeline" // Import the new component
import TimeTable from "@/components/time-table" // Import the TimeTable component
import { formatDuration } from "@/lib/utils" // Import formatDuration from utils
import { timeEntriesService } from "@/lib/timeEntries"

interface TimeEntry {
  _id?: string
  date: string // YYYY-MM-DD
  timeIn: string // HH:MM AM/PM
  timeOut: string | null // HH:MM AM/PM
  duration: number // in seconds
}

export default function Component() {
  const [isTracking, setIsTracking] = useState(false)
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null)
  const [currentSessionTime, setCurrentSessionTime] = useState(0)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // Load data from backend on mount
  useEffect(() => {
    loadTimeEntries()
    checkActiveSession()
  }, [])

  const checkActiveSession = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/session', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.isTracking && data.sessionStart) {
        setIsTracking(true)
        setCurrentSessionStart(new Date(data.sessionStart))
      }
    } catch (error) {
      console.error('Failed to check session:', error)
    }
  }

  const loadTimeEntries = async () => {
    try {
      const entries = await timeEntriesService.getEntries()
      setTimeEntries(entries)
    } catch (error) {
      console.error('Failed to load time entries:', error)
    }
  }

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTracking && currentSessionStart) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)
        setCurrentSessionTime(diff)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, currentSessionStart])

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Force timeline re-render every 30 minutes when tracking
  useEffect(() => {
    if (!isTracking) return
    
    const interval = setInterval(() => {
      // Force component re-render to update timeline
      setCurrentTime(new Date())
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(interval)
  }, [isTracking])

  // Formats duration for the main timer display (HH:MM:SS)
  const formatTimerDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Formats current clock time for display (HH:MM AM/PM)
  const formatCurrentClockTime = () => {
    const now = new Date()
    return now.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleTimeIn = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'start' })
      })
      const data = await response.json()
      
      if (data.success) {
        const now = new Date(data.sessionStart)
        setIsTracking(true)
        setCurrentSessionStart(now)
        setCurrentSessionTime(0)
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const handleTimeOut = async () => {
    if (!currentSessionStart) return

    const now = new Date()
    const duration = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)

    const newEntry = {
      date: now.toLocaleDateString("en-CA"),
      timeIn: currentSessionStart.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      }),
      timeOut: now.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      }),
      duration: duration,
    }

    try {
      await timeEntriesService.createEntry(newEntry)
      await loadTimeEntries() // Reload entries from backend
    } catch (error) {
      console.error('Failed to save time entry:', error)
    }

    try {
      const token = localStorage.getItem('authToken')
      await fetch('/api/session', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'stop' })
      })
    } catch (error) {
      console.error('Failed to stop session:', error)
    }

    setIsTracking(false)
    setCurrentSessionStart(null)
    setCurrentSessionTime(0)
  }

  const getTodayEntries = () => {
    const today = new Date().toLocaleDateString("en-CA")
    const completedEntries = timeEntries.filter((entry) => entry.date === today)
    
    // If tracking and no completed entries, create a live entry for timeline
    if (isTracking && currentSessionStart && completedEntries.length === 0) {
      const liveEntry = {
        _id: 'live-session',
        date: today,
        timeIn: currentSessionStart.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        }),
        timeOut: null,
        duration: currentSessionTime
      }
      return [liveEntry]
    }
    
    return completedEntries
  }

  const todayEntries = getTodayEntries()

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Timer Card */}
        <Card className="text-center">
          <CardContent className="p-8 md:p-6">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-8 md:space-y-0">
              {/* Left Side: Current Time & Date */}
              <div className="flex-1 text-center md:text-left space-y-3 md:space-y-2">
                <div className="text-3xl md:text-2xl font-mono font-bold text-primary">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour12: true,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-sm md:text-sm text-muted-foreground">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                {isTracking && currentSessionStart ? (
                  <div className="text-base md:text-lg text-muted-foreground">
                    Started at{" "}
                    <span className="font-semibold text-primary">
                      {currentSessionStart.toLocaleTimeString("en-US", {
                        hour12: true,
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ) : (
                  <div className="text-base md:text-lg text-muted-foreground">Ready to start tracking</div>
                )}
              </div>

              {/* Right Side: Elapsed Timer and Button */}
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-8">
                {/* Elapsed Timer */}
                <div className="text-center">
                  <div className="text-6xl md:text-6xl font-mono font-bold text-primary">
                    {formatTimerDisplay(currentSessionTime)}
                  </div>
                  <div className="text-sm md:text-sm text-muted-foreground mt-2 md:mt-1">{isTracking ? "Elapsed Time" : "Session Time"}</div>
                </div>

                {/* Timer Button */}
                <div className="flex justify-center">
                  {!isTracking ? (
                    <Button onClick={handleTimeIn} size="lg" className="gap-2 rounded-full w-20 h-20 md:w-16 md:h-16 p-0">
                      <Play className="w-8 h-8 md:w-6 md:h-6" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleTimeOut}
                      size="lg"
                      variant="destructive"
                      className="gap-2 rounded-full w-20 h-20 md:w-16 md:h-16 p-0"
                    >
                      <Square className="w-8 h-8 md:w-6 md:h-6" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline - Hidden on mobile, shown when tracking or has entries */}
        {(todayEntries.length > 0 || isTracking) && (
          <Card className="hidden md:block">
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Calendar className="w-5 h-5" />
                {isTracking && todayEntries.length === 1 && todayEntries[0]._id === 'live-session' 
                  ? 'Currently Working' 
                  : 'Worked Today'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <DayTimeline entries={todayEntries.map(e => ({...e, id: e._id || e.date + e.timeIn}))} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
