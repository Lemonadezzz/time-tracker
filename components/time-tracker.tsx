"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

import { Play, Square, Calendar, Clock } from "lucide-react"
import DayTimeline from "./day-timeline" // Import the new component

import { timeEntriesService } from "@/lib/timeEntries"

interface TimeEntry {
  _id?: string
  date: string // YYYY-MM-DD
  timeIn: string // HH:MM AM/PM
  timeOut: string | null // HH:MM AM/PM
  duration: number // in seconds
  location?: string // Location where time was tracked
}

export default function Component() {
  const [isTracking, setIsTracking] = useState(false)
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null)
  const [currentSessionTime, setCurrentSessionTime] = useState(0)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<string>('')
  const [locality, setLocality] = useState<string>('')
  const [principalSubdivision, setPrincipalSubdivision] = useState<string>('')
  const [buttonCooldown, setButtonCooldown] = useState(false)
  const locationRequestedRef = useRef(false)

  // Load data from backend on mount
  useEffect(() => {
    loadTimeEntries()
    checkActiveSession()
    getUserLocation()
    
    // Immediate auto-stop check
    const now = new Date()
    if (now.getHours() >= 22) {
      fetch('/api/cron/auto-stop')
        .catch(error => console.error('Initial auto-stop check failed:', error))
    }
  }, [])

  const getUserLocation = () => {
    if (!navigator.geolocation || locationRequestedRef.current) {
      if (!navigator.geolocation) {
        setLocation('Geolocation not supported')
        setLocality('Location Unavailable')
      }
      return
    }

    locationRequestedRef.current = true

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          // Get location
          const locationResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          const locationData = await locationResponse.json()
          const localityData = locationData.locality || 'Unknown Locality'
          const regionData = locationData.principalSubdivision || 'Unknown Region'
          
          setLocality(localityData)
          setPrincipalSubdivision(regionData)
          
          // Get weather
          const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`)
          const weatherData = await weatherResponse.json()
          const temp = Math.round(weatherData.current_weather.temperature)
          const weatherCode = weatherData.current_weather.weathercode
          const weatherEmoji = getWeatherEmoji(weatherCode)
          
          setLocation(`${weatherEmoji} ${temp}°C — ${localityData}, ${regionData}`)
          
          // Custom toast with progress bar
          const toastId = toast.success("Location updated", {
            description: (
              <div>
                <div>{`${localityData}, ${regionData}`}</div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div className="bg-green-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                    animation: 'progress 3s linear forwards'
                  }}></div>
                </div>
              </div>
            ),
            duration: 3000
          })
        } catch (error) {
          setLocation('Location unavailable')
          setLocality('Location Unavailable')
        }
      },
      () => {
        setLocation('Location access denied')
        setLocality('Location Unavailable')
        toast.error("Location denied", {
          description: (
            <div>
              <div>Location access was denied</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                  animation: 'progress 3s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 3000
        })
      },
      {
        timeout: 10000,
        enableHighAccuracy: true
      }
    )
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

  // Timer effect with auto-stop at 10pm
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTracking && currentSessionStart) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)
        setCurrentSessionTime(diff)
        
        // Auto-stop at or after 10pm (22:00)
        if (now.getHours() >= 22) {
          handleAutoStop()
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, currentSessionStart])

  // Update current time every minute and check for auto-stop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      
      // Check for auto-stop at or after 10pm
      if (now.getHours() >= 22) {
        fetch('/api/cron/auto-stop')
          .catch(error => console.error('Auto-stop check failed:', error))
      }
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
    
    const now = new Date()
    
    // Check work hours (6AM - 10PM)
    if (now.getHours() < 6 || now.getHours() >= 22) {
      toast.error("Cannot start timer", {
        description: (
          <div>
            <div>Work hours are 6:00 AM - 10:00 PM</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
      return
    }
    
    // Check daily hours limit (16 hours including lunch)
    const today = now.toLocaleDateString("en-CA")
    const todayEntries = timeEntries.filter(entry => entry.date === today)
    const todayDuration = todayEntries.reduce((total, entry) => total + entry.duration, 0)
    const maxDuration = 16 * 60 * 60 // 16 hours in seconds
    
    if (todayDuration >= maxDuration) {
      toast.error("Daily limit reached", {
        description: (
          <div>
            <div>Maximum 16 hours per day (including lunch)</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
      return
    }
    
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
        body: JSON.stringify({ action: 'start', location: locality && principalSubdivision ? `${locality}, ${principalSubdivision}` : 'Location Unavailable' })
      })
      const data = await response.json()
      
      if (data.success) {
        const now = new Date(data.sessionStart)
        setIsTracking(true)
        setCurrentSessionStart(now)
        setCurrentSessionTime(0)
        toast.success("Started working", {
          description: (
            <div>
              <div>Time tracking is now active</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-green-500 h-1 rounded-full animate-[progress_2s_linear_forwards]" style={{
                  animation: 'progress 2s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Failed to start session:', error)
      toast.error("Failed to start timer", {
        description: (
          <div>
            <div>Please try again</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
    }
  }

  const handleAutoStop = async () => {
    if (!currentSessionStart) return
    
    const stopTime = new Date()
    stopTime.setHours(22, 0, 0, 0) // Set to exactly 10:00 PM
    
    const duration = Math.floor((stopTime.getTime() - currentSessionStart.getTime()) / 1000)
    
    // Use the location from when timer started (stored in state)
    const startLocation = locality && principalSubdivision ? `${locality}, ${principalSubdivision}` : 'Location Unavailable'
    
    const newEntry = {
      date: currentSessionStart.toLocaleDateString("en-CA"),
      timeIn: currentSessionStart.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      }),
      timeOut: "10:00 PM",
      duration: duration,
      location: startLocation,
    }

    try {
      await timeEntriesService.createEntry(newEntry)
      await loadTimeEntries()
      
      const token = localStorage.getItem('authToken')
      await fetch('/api/session', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'stop' })
      })
      
      toast.warning("Timer auto-stopped", {
        description: (
          <div>
            <div>Automatically stopped at 10:00 PM</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-orange-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 5000
      })
    } catch (error) {
      console.error('Failed to auto-stop timer:', error)
    }

    setIsTracking(false)
    setCurrentSessionStart(null)
    setCurrentSessionTime(0)
  }

  const handleTimeOut = async () => {
    if (!currentSessionStart || buttonCooldown) return
    
    setButtonCooldown(true)
    setTimeout(() => setButtonCooldown(false), 3000)

    const now = new Date()
    const duration = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)

    // Use current location for manual stop
    let currentLocation = locality && principalSubdivision ? `${locality}, ${principalSubdivision}` : 'Location Unavailable'
    
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
      location: currentLocation,
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
      
      toast.success("Stopped working", {
        description: (
          <div>
            <div>Session duration: {formatTimerDisplay(currentSessionTime)}</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-green-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
    } catch (error) {
      console.error('Failed to stop session:', error)
      toast.error("Failed to stop timer", {
        description: "Please try again"
      })
    }

    setIsTracking(false)
    setCurrentSessionStart(null)
    setCurrentSessionTime(0)
  }

  const getTodayEntries = () => {
    const today = new Date().toLocaleDateString("en-CA")
    
    // Get individual entries for today (not consolidated)
    const todayConsolidated = timeEntries.find((entry) => entry.date === today)
    const individualEntries = (todayConsolidated?.entries || []).map(entry => ({
      ...entry,
      date: today // Ensure each entry has the date field
    }))
    
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
      return [...individualEntries, liveEntry]
    }
    
    return individualEntries
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
                    <div className="relative">
                      <Button 
                        onClick={handleTimeIn} 
                        size="lg" 
                        className="gap-2 rounded-full w-20 h-20 md:w-24 md:h-24 p-0 cursor-pointer relative overflow-hidden"
                        disabled={buttonCooldown}
                      >
                        <span className="text-4xl md:text-5xl font-bold relative z-10">▶</span>
                        {buttonCooldown && (
                          <div className="absolute inset-0 bg-gray-400/50 rounded-full animate-pulse" />
                        )}
                      </Button>
                      {buttonCooldown && (
                        <div className="absolute inset-0 bg-gray-500/30 rounded-full animate-[slideIn_3s_ease-out]" />
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <Button
                        onClick={handleTimeOut}
                        size="lg"
                        className="gap-2 rounded-full w-20 h-20 md:w-24 md:h-24 p-0 cursor-pointer relative overflow-hidden bg-red-600 hover:bg-red-700 text-white"
                        disabled={buttonCooldown}
                      >
                        <span className="text-4xl md:text-5xl font-bold relative z-10">⏹</span>
                        {buttonCooldown && (
                          <div className="absolute inset-0 bg-gray-400/50 rounded-full animate-pulse" />
                        )}
                      </Button>
                      {buttonCooldown && (
                        <div className="absolute inset-0 bg-gray-500/30 rounded-full animate-[slideIn_3s_ease-out]" />
                      )}
                    </div>
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
