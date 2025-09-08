"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Play, Square, Calendar, Clock } from "lucide-react"
import DayTimeline from "./day-timeline" // Import the new component

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
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<string>('')
  const [buttonCooldown, setButtonCooldown] = useState(false)

  // Load data from backend on mount
  useEffect(() => {
    loadTimeEntries()
    checkActiveSession()
    getUserLocation()
  }, [])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            
            // Get location
            const locationResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            const locationData = await locationResponse.json()
            const locality = locationData.locality || 'Unknown Locality'
            const principalSubdivision = locationData.principalSubdivision || 'Unknown Region'
            
            // Get weather
            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`)
            const weatherData = await weatherResponse.json()
            const temp = Math.round(weatherData.current_weather.temperature)
            const weatherCode = weatherData.current_weather.weathercode
            const weatherEmoji = getWeatherEmoji(weatherCode)
            
            setLocation(`${weatherEmoji} ${temp}°C — ${locality}, ${principalSubdivision}`)
          } catch (error) {
            setLocation('Location unavailable')

          }
        },
        () => {
          setLocation('Location access denied')

        }
      )
    } else {
      setLocation('Geolocation not supported')

    }
  }

  const getWeatherEmoji = (code: number) => {
    if (code === 0) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '☁️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '🌨️'
    if (code <= 82) return '🌦️'
    return '⛈️'
  }



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
    } finally {
      setLoading(false)
    }
  }

  const loadTimeEntries = async () => {
    try {
      const { entries } = await timeEntriesService.getEntries()
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



  const handleTimeIn = async () => {
    if (buttonCooldown) return
    
    setButtonCooldown(true)
    setTimeout(() => setButtonCooldown(false), 3000)
    
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
    if (!currentSessionStart || buttonCooldown) return
    
    setButtonCooldown(true)
    setTimeout(() => setButtonCooldown(false), 3000)

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
    
    // If currently tracking, add live session to the list
    if (isTracking && currentSessionStart) {
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
      return [...completedEntries, liveEntry]
    }
    
    return completedEntries
  }

  const todayEntries = getTodayEntries()

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6 pt-20 md:pt-6">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Greeting */}
        {!loading && (
          <div className="text-center md:text-left px-1">
            <h1 className="text-xl md:text-3xl font-bold text-foreground">
              {getGreeting()}!
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {location || 'Getting your location...'}
            </p>
          </div>
        )}

        {/* Timer Card */}
        <Card className="text-center">
          <CardContent className="p-4 md:p-6">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-6 md:space-y-0">
              {/* Left Side: Current Time & Date */}
              <div className="flex-1 text-center md:text-left space-y-2 md:space-y-2">
                <div className="text-2xl md:text-2xl font-mono font-bold text-primary">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour12: true,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                {isTracking && currentSessionStart ? (
                  <div className="text-sm md:text-lg text-muted-foreground">
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
                  <div className="text-sm md:text-lg text-muted-foreground">Ready to start tracking</div>
                )}
              </div>

              {/* Right Side: Elapsed Timer and Button */}
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Elapsed Timer */}
                <div className="text-center">
                  {loading ? (
                    <div className="text-4xl md:text-6xl font-mono font-bold text-muted-foreground">
                      --:--:--
                    </div>
                  ) : (
                    <div className="text-4xl md:text-6xl font-mono font-bold text-primary">
                      {formatTimerDisplay(currentSessionTime)}
                    </div>
                  )}
                  <div className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-1">
                    {loading ? "Loading..." : (isTracking ? "Elapsed Time" : "Session Time")}
                  </div>
                </div>

                {/* Timer Button */}
                <div className="flex justify-center">
                  {loading ? (
                    <Button size="lg" className="gap-2 rounded-full w-16 h-16 md:w-16 md:h-16 p-0" disabled>
                      <Clock className="w-6 h-6 md:w-6 md:h-6 animate-spin" />
                    </Button>
                  ) : !isTracking ? (
                    <Button 
                      onClick={handleTimeIn} 
                      size="lg" 
                      className={`gap-2 rounded-full w-16 h-16 md:w-16 md:h-16 p-0 cursor-pointer ${buttonCooldown ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={buttonCooldown}
                    >
                      <Play className="w-6 h-6 md:w-6 md:h-6" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleTimeOut}
                      size="lg"
                      variant="destructive"
                      className={`gap-2 rounded-full w-16 h-16 md:w-16 md:h-16 p-0 cursor-pointer ${buttonCooldown ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={buttonCooldown}
                    >
                      <Square className="w-6 h-6 md:w-6 md:h-6" />
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
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-xl">
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                {isTracking && todayEntries.length === 1 && todayEntries[0]._id === 'live-session' 
                  ? 'Currently Working' 
                  : 'Worked Today'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <DayTimeline entries={todayEntries.map(e => ({...e, id: e._id || e.date + e.timeIn}))} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
