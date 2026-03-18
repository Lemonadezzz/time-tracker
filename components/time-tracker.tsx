"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

import { Play, Calendar, Clock, Coffee } from "lucide-react"
import DayTimeline from "./day-timeline"

import { timeEntriesService } from "@/lib/timeEntries"

interface TimeEntry {
  _id?: string
  date: string // YYYY-MM-DD
  timeIn: string // HH:MM AM/PM
  timeOut: string | null // HH:MM AM/PM
  duration: number // in seconds
  location?: string // Location where time was tracked
  breakPeriods?: Array<{
    startTime: string
    endTime: string
    duration: number
  }>
}

export default function Component() {
  const [isTracking, setIsTracking] = useState(false)
  const [isOnBreak, setIsOnBreak] = useState(false)
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null)
  const [currentSessionTime, setCurrentSessionTime] = useState(0)
  const [pausedSessionTime, setPausedSessionTime] = useState(0) // Time when break started
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<string>('')
  const [locality, setLocality] = useState<string>('')
  const [principalSubdivision, setPrincipalSubdivision] = useState<string>('')
  const [buttonCooldown, setButtonCooldown] = useState(false)
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(5400) // 1.5 hours in seconds
  const [breakTimeUsed, setBreakTimeUsed] = useState(0)
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null)
  const [currentBreakDuration, setCurrentBreakDuration] = useState(0)
  const locationRequestedRef = useRef(false)
  const isStoppingRef = useRef(false)

  // Load data from backend on mount
  useEffect(() => {
    loadTimeEntries()
    checkActiveSession()
    getUserLocation()

    // Cross-tab sync: listen for session changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sessionSync') {
        checkActiveSession()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
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

          toast.success("Location updated", {
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
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/session', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })

      if (!response.ok) {
        setLoading(false)
        return
      }

      const data = await response.json()

      if (data.isTracking && data.sessionStart) {
        const sessionStart = new Date(data.sessionStart)
        const now = new Date()
        
        // Set session start and break tracking first
        setCurrentSessionStart(sessionStart)
        setBreakTimeRemaining(data.breakTimeRemaining || 0)
        setBreakTimeUsed(data.breakTimeUsed || 0)
        
        if (data.isOnBreak && data.currentBreakStart) {
          // Currently on break - calculate work time before break started
          const breakStartTime = new Date(data.currentBreakStart)
          const totalElapsedBeforeBreak = Math.floor((breakStartTime.getTime() - sessionStart.getTime()) / 1000)
          const workTimeBeforeBreak = totalElapsedBeforeBreak - (data.breakTimeUsed || 0)
          
          setPausedSessionTime(Math.max(0, workTimeBeforeBreak))
          setCurrentSessionTime(Math.max(0, workTimeBeforeBreak))
          setBreakStartTime(breakStartTime)
          setIsOnBreak(true)
        } else {
          // Not on break - calculate current work time
          const totalElapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
          const workTime = totalElapsed - (data.breakTimeUsed || 0)
          setCurrentSessionTime(Math.max(0, workTime))
          setPausedSessionTime(0)
          setIsOnBreak(false)
        }
        
        // Set tracking state last to trigger timer effect with all data ready
        setIsTracking(true)

        // Show auto-resume notification if applicable
        if (data.autoResumed) {
          toast.info("Break time limit reached", {
            description: "Work automatically resumed after 1.5 hours of break time."
          })
        }
      } else {
        setBreakTimeRemaining(data.breakTimeRemaining || 5400)
        setBreakTimeUsed(data.breakTimeUsed || 0)
      }
    } catch (error) {
      // Session check failed silently
    } finally {
      setLoading(false)
    }
  }

  const loadTimeEntries = async () => {
    try {
      const { entries } = await timeEntriesService.getEntries()
      setTimeEntries(entries)
    } catch (error) {
      // Failed to load entries silently
    }
  }

  // Timer effect - Update every second when tracking
  useEffect(() => {
    if (!isTracking || !currentSessionStart) return

    const calculateTime = () => {
      if (isOnBreak) {
        // During break, keep timer frozen at paused time
        setCurrentSessionTime(pausedSessionTime)
      } else {
        // Not on break: calculate work time from session start minus break time
        const now = new Date()
        const totalElapsed = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)
        const workTime = totalElapsed - breakTimeUsed
        setCurrentSessionTime(Math.max(0, workTime))
      }

      // If computer slept through midnight, force reload
      const now = new Date()
      if (now.toLocaleDateString('en-CA') !== currentSessionStart.toLocaleDateString('en-CA') && !isStoppingRef.current) {
        window.location.reload()
        return false
      }

      // Auto-stop at 11:59 PM
      if (now.getHours() === 23 && now.getMinutes() >= 59 && !isStoppingRef.current) {
        const stopBtn = document.getElementById('stop-tracking-btn')
        if (stopBtn) {
          toast.info("Session auto-closing", {
            description: "Timers are automatically stopped at 11:59 PM."
          })
          stopBtn.click()
        }
        return false
      }
      return true
    }

    // Calculate immediately on mount/change
    calculateTime()

    // Then set up interval
    const interval = setInterval(() => {
      if (!calculateTime()) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isTracking, currentSessionStart, isOnBreak, breakTimeUsed, pausedSessionTime])

  // Break time monitoring effect - reduced frequency to avoid API limits
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTracking && isOnBreak && breakStartTime) {
      // Update current break duration locally every second
      interval = setInterval(() => {
        const now = new Date()
        const breakDuration = Math.floor((now.getTime() - breakStartTime.getTime()) / 1000)
        setCurrentBreakDuration(breakDuration)
        
        // Check if we've hit the limit locally first
        const totalBreakTime = breakTimeUsed + breakDuration
        const maxBreakTime = 90 * 60 // 1.5 hours
        
        if (totalBreakTime >= maxBreakTime) {
          // Auto-resume locally and then sync with server
          setIsOnBreak(false)
          setBreakStartTime(null)
          setCurrentBreakDuration(0)
          setBreakTimeUsed(maxBreakTime)
          setBreakTimeRemaining(0)
          // Resume from paused time
          setCurrentSessionTime(pausedSessionTime)
          
          // Sync with server (fire and forget) - this will also log the break end
          const token = localStorage.getItem('authToken')
          if (token) {
            fetch('/api/session', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ action: 'resume' })
            }).catch(() => {})
          }
          
          toast.info("Break time limit reached", {
            description: "Work automatically resumed after 1.5 hours of break time."
          })
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, isOnBreak, breakStartTime, breakTimeUsed, pausedSessionTime])

  // Update current time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatTimerDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleTimeIn = async () => {
    if (buttonCooldown) return

    const now = new Date()

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

    setButtonCooldown(true)
    setTimeout(() => setButtonCooldown(false), 3000)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        body: JSON.stringify({ action: 'start', location: locality && principalSubdivision ? `${locality}, ${principalSubdivision}` : 'Location Unavailable' })
      })
      const data = await response.json()

      if (data.success) {
        const sessionStartDate = new Date(data.sessionStart)
        setCurrentSessionStart(sessionStartDate)
        setCurrentSessionTime(0)
        setBreakTimeUsed(0)
        setPausedSessionTime(0)
        setIsTracking(true)

        // Notify other tabs
        localStorage.setItem('sessionSync', Date.now().toString())

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

  const handleTakeBreak = async () => {
    if (buttonCooldown || !isTracking) return
    
    if (breakTimeRemaining <= 0) {
      toast.error("Break limit reached", {
        description: "You've used your daily 1.5 hours of break time."
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
        body: JSON.stringify({ action: 'break' })
      })
      const data = await response.json()
      
      if (data.success) {
        const now = new Date()
        // Store current work time as paused time
        setPausedSessionTime(currentSessionTime)
        setIsOnBreak(true)
        setBreakStartTime(now)
        setCurrentBreakDuration(0)
        setBreakTimeRemaining(data.breakTimeRemaining || 0)
        
        // Notify other tabs
        localStorage.setItem('sessionSync', Date.now().toString())
        
        const remainingMinutes = Math.floor(data.breakTimeRemaining / 60)
        toast.success("Break started", {
          description: (
            <div>
              <div>Timer paused for break</div>
              <div className="text-xs mt-1">{remainingMinutes} minutes remaining today</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-blue-500 h-1 rounded-full animate-[progress_2s_linear_forwards]" style={{
                  animation: 'progress 2s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 2000
        })
      } else if (data.error === 'Daily break limit reached') {
        toast.error("Break limit reached", {
          description: "You've used your daily 1.5 hours of break time."
        })
      }
    } catch (error) {
      toast.error("Failed to start break", {
        description: "Please try again"
      })
    }
  }

  const handleResumeWork = async () => {
    if (buttonCooldown || !isTracking) return
    
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
        body: JSON.stringify({ action: 'resume' })
      })
      const data = await response.json()
      
      if (data.success) {
        // Update break time tracking from server
        const newBreakTimeUsed = data.breakTimeUsed || 0
        setBreakTimeUsed(newBreakTimeUsed)
        setBreakTimeRemaining(data.breakTimeRemaining || 0)
        
        // End break state
        setIsOnBreak(false)
        setBreakStartTime(null)
        setCurrentBreakDuration(0)
        
        // Don't manually set currentSessionTime - let the timer effect calculate it
        // based on the updated breakTimeUsed
        
        // Notify other tabs
        localStorage.setItem('sessionSync', Date.now().toString())
        
        const remainingMinutes = Math.floor(data.breakTimeRemaining / 60)
        toast.success("Work resumed", {
          description: (
            <div>
              <div>Timer resumed from break</div>
              <div className="text-xs mt-1">{remainingMinutes} minutes break time remaining today</div>
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
      toast.error("Failed to resume work", {
        description: "Please try again"
      })
    }
  }
  const handleTimeOut = async () => {
    if (!currentSessionStart || buttonCooldown || isStoppingRef.current) return

    isStoppingRef.current = true
    setButtonCooldown(true)
    setIsTracking(false)
    setIsOnBreak(false) // Reset break state when stopping

    const sessionStart = currentSessionStart
    const sessionTime = currentSessionTime
    setCurrentSessionStart(null)
    setCurrentSessionTime(0)

    const now = new Date()
    const duration = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
    const currentLocation = locality && principalSubdivision ? `${locality}, ${principalSubdivision}` : 'Location Unavailable'

    // Get break periods from the session
    let breakPeriods: any[] = []
    try {
      const token = localStorage.getItem('authToken')
      const sessionResponse = await fetch('/api/session', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        breakPeriods = sessionData.breakPeriods || []
      }
    } catch (error) {
      // Failed to get break periods
    }

    const newEntry = {
      date: now.toLocaleDateString("en-CA"),
      timeIn: sessionStart.toLocaleTimeString("en-US", {
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
      breakPeriods: breakPeriods
    }

    try {
      // Save entry first (most important)
      await timeEntriesService.createEntry(newEntry)

      // Stop session in background (less critical)
      const token = localStorage.getItem('authToken')
      fetch('/api/session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        body: JSON.stringify({ action: 'stop', location: currentLocation })
      }).catch(() => {})

      // Notify other tabs
      localStorage.setItem('sessionSync', Date.now().toString())

      await loadTimeEntries()

      toast.success("Stopped working", {
        description: (
          <div>
            <div>Session duration: {formatTimerDisplay(sessionTime)}</div>
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
      toast.error("Failed to stop timer", {
        description: "Please try again"
      })
      // Restore state on failure
      setIsTracking(true)
      setCurrentSessionStart(sessionStart)
      setCurrentSessionTime(sessionTime)
    } finally {
      isStoppingRef.current = false
      setTimeout(() => setButtonCooldown(false), 3000)
    }
  }

  const getTodayEntries = () => {
    const today = new Date().toLocaleDateString("en-CA")
    const todayConsolidated = timeEntries.find((entry) => entry.date === today)
    const individualEntries = (todayConsolidated?.entries || []).map(entry => ({
      ...entry,
      date: today,
      breakPeriods: entry.breakPeriods || todayConsolidated?.breakPeriods || []
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
        duration: currentSessionTime,
        isOnBreak: isOnBreak,
        breakPeriods: [] // Live sessions don't have completed break periods yet
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
    <div className="min-h-screen bg-background">
      {/* Header Section - Tucked at top */}
      {!loading && (
        <div className="border-b bg-card">
          <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6">
            <h1 className="text-xl md:text-3xl font-bold text-foreground">
              {getGreeting()}!
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {location || 'Getting your location...'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
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
                    {isOnBreak && breakStartTime ? (
                      <>
                        Break started at{" "}
                        <span className="font-semibold text-blue-600">
                          {breakStartTime.toLocaleTimeString("en-US", {
                            hour12: true,
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    ) : (
                      <>
                        Started at{" "}
                        <span className="font-semibold text-primary">
                          {currentSessionStart.toLocaleTimeString("en-US", {
                            hour12: true,
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    )}
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
                    {loading ? "Loading..." : (
                      isTracking ? (
                        isOnBreak ? (
                          <>
                            On Break • {formatTimerDisplay(currentBreakDuration)} elapsed
                          </>
                        ) : (
                          "Elapsed Time"
                        )
                      ) : (
                        "Session Time"
                      )
                    )}
                  </div>
                  
                  {/* Take a Break / Resume Button */}
                  {isTracking && (
                    <div className="mt-3">
                      {!isOnBreak ? (
                        <Button
                          onClick={handleTakeBreak}
                          variant="outline"
                          size="sm"
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                          disabled={buttonCooldown || breakTimeRemaining <= 0}
                        >
                          <Coffee className="w-4 h-4 mr-2" />
                          {breakTimeRemaining <= 0 ? 'Break Limit Reached' : 'Take a Break'}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleResumeWork}
                          variant="outline"
                          size="sm"
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                          disabled={buttonCooldown}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Resume Work
                        </Button>
                      )}
                      {/* Break time remaining indicator */}
                      <div className="text-xs text-muted-foreground mt-1">
                        Break time: {Math.floor(breakTimeRemaining / 60)}m remaining today
                      </div>
                    </div>
                  )}
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
                        id="stop-tracking-btn"
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

        {/* Timeline - Mobile: Show total time, Desktop: Full timeline */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-xl">
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              Worked Today
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            {todayEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No time entries for today</p>
              </div>
            ) : (
              <>
                {/* Mobile: Total time worked */}
                <div className="md:hidden">
                  <div className="flex justify-between items-center py-4">
                    <div className="text-base text-muted-foreground">Time worked</div>
                    <div className="text-base font-medium text-foreground">
                      {(() => {
                        const totalSeconds = todayEntries.reduce((sum, entry) => sum + entry.duration, 0)
                        const hours = Math.floor(totalSeconds / 3600)
                        const minutes = Math.floor((totalSeconds % 3600) / 60)
                        return hours > 0 ? `${hours}hrs ${minutes}mins` : `${minutes}mins`
                      })()}
                    </div>
                  </div>
                </div>
                {/* Desktop: Timeline view */}
                <div className="hidden md:block">
                  <DayTimeline entries={todayEntries.map(e => ({ ...e, id: e._id || e.date + e.timeIn }))} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
