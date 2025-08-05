"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Play, Square, Calendar } from "lucide-react"
import DayTimeline from "./day-timeline" // Import the new component
import TimeTable from "@/components/TimeTable" // Import the TimeTable component
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
    
    const savedTracking = localStorage.getItem("isTracking")
    const savedSessionStart = localStorage.getItem("currentSessionStart")

    if (savedTracking === "true" && savedSessionStart) {
      setIsTracking(true)
      setCurrentSessionStart(new Date(savedSessionStart))
    }
  }, [])

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

  const handleTimeIn = () => {
    const now = new Date()
    setIsTracking(true)
    setCurrentSessionStart(now)
    setCurrentSessionTime(0)
    localStorage.setItem("isTracking", "true")
    localStorage.setItem("currentSessionStart", now.toISOString())
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

    setIsTracking(false)
    setCurrentSessionStart(null)
    setCurrentSessionTime(0)
    localStorage.removeItem("isTracking")
    localStorage.removeItem("currentSessionStart")
  }

  const getTodayEntries = () => {
    const today = new Date().toLocaleDateString("en-CA")
    return timeEntries.filter((entry) => entry.date === today)
  }

  const todayEntries = getTodayEntries()

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Timer Card */}
        <Card className="text-center">
          <CardContent className="flex justify-between items-center p-6">
            {/* Left Side: Current Time & Date, and "Started working at" text or "Ready to start tracking" */}
            <div className="flex-1 text-left space-y-2">
              <div className="text-2xl font-mono font-bold text-primary">
                {currentTime.toLocaleTimeString("en-US", {
                  hour12: true,
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              {isTracking && currentSessionStart ? (
                <div className="text-lg text-muted-foreground">
                  Started working at{" "}
                  <span className="font-semibold text-primary">
                    {currentSessionStart.toLocaleTimeString("en-US", {
                      hour12: true,
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ) : (
                <div className="text-lg text-muted-foreground">Ready to start tracking</div>
              )}
            </div>

            {/* Right Side: Elapsed Timer and Button */}
            <div className="flex items-center gap-8">
              {/* Elapsed Timer */}
              <div className="text-center">
                <div className="text-6xl font-mono font-bold text-primary">
                  {formatTimerDisplay(currentSessionTime)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{isTracking ? "Elapsed Time" : "Session Time"}</div>
              </div>

              {/* Timer Button */}
              <div className="flex justify-center">
                {!isTracking ? (
                  <Button onClick={handleTimeIn} size="lg" className="gap-2 rounded-full w-16 h-16 p-0">
                    <Play className="w-6 h-6" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleTimeOut}
                    size="lg"
                    variant="destructive"
                    className="gap-2 rounded-full w-16 h-16 p-0"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Worked Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DayTimeline entries={todayEntries} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
