"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Calendar, Clock } from "lucide-react"
import DayTimeline from "./day-timeline"
import { timeEntriesService } from "@/lib/timeEntries"

interface TimeEntry {
  _id?: string
  date: string
  timeIn: string
  timeOut: string | null
  duration: number
  location?: string
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
  const [sevenHourNotificationShown, setSevenHourNotificationShown] = useState(false)
  const locationRequestedRef = useRef(false)
  const isStoppingRef = useRef(false)

  // Load data from backend on mount
  useEffect(() => {
    loadTimeEntries()
    checkActiveSession()
    getUserLocation()
    requestNotificationPermission()

    // Cross-tab sync: listen for session changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sessionSync') {
        checkActiveSession()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'time-tracker-reminder'
      })
    }
  }

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
          const locationResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          const locationData = await locationResponse.json()
          const localityData = locationData.locality || 'Unknown Locality'
          const regionData = locationData.principalSubdivision || 'Unknown Region'
          setLocality(localityData)
          setPrincipalSubdivision(regionData)

          const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`)
          const weatherData = await weatherResponse.json()
          const temp = Math.round(weatherData.current_weather.temperature)
          const weatherCode = weatherData.current_weather.weathercode
          const weatherEmoji = getWeatherEmoji(weatherCode)

          setLocation(`${weatherEmoji} ${temp}°C — ${localityData}, ${regionData}`)
        } catch (error) {
          setLocation('Location unavailable')
          setLocality('Location Unavailable')
        }
      },
      () => {
        setLocation('Location access denied')
        setLocality('Location Unavailable')
      },
      { timeout: 10000, enableHighAccuracy: true }
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
        
        setCurrentSessionStart(sessionStart)
        const totalElapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
        setCurrentSessionTime(Math.max(0, totalElapsed))
        
        setIsTracking(true)
      }
    } catch (error) {
      // Failed silently
    } finally {
      setLoading(false)
    }
  }

  const loadTimeEntries = async () => {
    try {
      const { entries } = await timeEntriesService.getEntries()
      setTimeEntries(entries)
    } catch (error) {
      // Failed silently
    }
  }

  useEffect(() => {
    if (!isTracking || !currentSessionStart) return

    const calculateTime = () => {
      const now = new Date()
      const totalElapsed = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)
      setCurrentSessionTime(Math.max(0, totalElapsed))
      
      const sevenHours = 7 * 60 * 60
      if (totalElapsed >= sevenHours && !sevenHourNotificationShown) {
        setSevenHourNotificationShown(true)
        showBrowserNotification(
          'Don\'t forget to clock out soon!',
          'You\'ve been working for 7 hours. Remember to stop your timer when you\'re done.'
        )
        toast.info('Don\'t forget to clock out soon!', {
          description: 'You\'ve been working for 7 hours. Remember to stop your timer when you\'re done.',
          duration: 10000
        })
      }

      if (now.toLocaleDateString('en-CA') !== currentSessionStart.toLocaleDateString('en-CA') && !isStoppingRef.current) {
        window.location.reload()
        return false
      }

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

    calculateTime()
    const interval = setInterval(() => {
      if (!calculateTime()) {
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isTracking, currentSessionStart, sevenHourNotificationShown])

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
        description: "Work hours are 6:00 AM - 10:00 PM",
        duration: 3000
      })
      return
    }

    setButtonCooldown(true)
    setTimeout(() => setButtonCooldown(false), 1500)

    try {
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      if (!localStorage.getItem('sessionId')) {
        localStorage.setItem('sessionId', sessionId)
      }
      
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({ action: 'start', location: locality && principalSubdivision ? `${locality}, ${principalSubdivision}` : 'Location Unavailable' })
      })
      const data = await response.json()

      if (data.success) {
        const sessionStartDate = new Date(data.sessionStart)
        setCurrentSessionStart(sessionStartDate)
        setCurrentSessionTime(0)
        setSevenHourNotificationShown(false)
        setIsTracking(true)

        if (data.sessionId) {
          localStorage.setItem('sessionId', data.sessionId)
        }

        localStorage.setItem('sessionSync', Date.now().toString())

        toast.success("Started working", {
          description: "Time tracking is now active",
          duration: 2000
        })
      }
    } catch (error) {
      toast.error("Failed to start timer", {
        description: "Please try again",
        duration: 3000
      })
    }
  }

  const handleTimeOut = async () => {
    if (!currentSessionStart || buttonCooldown || isStoppingRef.current) return

    isStoppingRef.current = true
    setButtonCooldown(true)
    setIsTracking(false)
    setSevenHourNotificationShown(false)

    const sessionStart = currentSessionStart
    const sessionTime = currentSessionTime
    setCurrentSessionStart(null)
    setCurrentSessionTime(0)

    const now = new Date()
    const totalElapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
    const currentLocation = locality && principalSubdivision ? `${locality}, ${principalSubdivision}` : 'Location Unavailable'

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
      duration: totalElapsed,
      location: currentLocation
    }

    try {
      await timeEntriesService.createEntry(newEntry)

      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')
      fetch('/api/session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
          'X-Session-Id': sessionId || ''
        },
        body: JSON.stringify({ action: 'stop', location: currentLocation })
      }).catch(() => {})

      localStorage.setItem('sessionSync', Date.now().toString())

      await loadTimeEntries()

      toast.success("Stopped working", {
        description: `Session duration: ${formatTimerDisplay(sessionTime)}`,
        duration: 3000
      })
    } catch (error) {
      toast.error("Failed to stop timer", { description: "Please try again" })
      setIsTracking(true)
      setCurrentSessionStart(sessionStart)
      setCurrentSessionTime(sessionTime)
    } finally {
      isStoppingRef.current = false
      setTimeout(() => setButtonCooldown(false), 1500)
    }
  }

  const getTodayEntries = () => {
    const today = new Date().toLocaleDateString("en-CA")
    const todayConsolidated = timeEntries.find((entry) => entry.date === today)
    const individualEntries = (todayConsolidated?.entries || []).map(entry => ({
      ...entry,
      date: today
    }))

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
    <div className="min-h-screen bg-background">
      {!loading && (
        <div className="md:hidden bg-card">
          <div className="px-3 py-4">
            <h1 className="text-xl font-bold text-foreground">{getGreeting()}!</h1>
            <p className="text-sm text-muted-foreground mt-1">{location || 'Getting your location...'}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        {!loading && (
          <div className="hidden md:block text-left px-1">
            <h1 className="text-3xl font-bold text-foreground">{getGreeting()}!</h1>
            <p className="text-base text-muted-foreground mt-1">{location || 'Getting your location...'}</p>
          </div>
        )}
        <Card className="text-center">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-6 md:space-y-0">
              <div className="flex-1 text-center md:text-left space-y-2 md:space-y-2">
                <div className="text-2xl md:text-2xl font-mono font-bold text-primary">
                  {currentTime.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
                {isTracking && currentSessionStart ? (
                  <div className="text-sm md:text-lg text-muted-foreground">
                    Started at <span className="font-semibold text-primary">
                      {currentSessionStart.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm md:text-lg text-muted-foreground">Ready to start tracking</div>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="text-center">
                  {loading ? (
                    <div className="text-4xl md:text-6xl font-mono font-bold text-muted-foreground">--:--:--</div>
                  ) : (
                    <div className="text-4xl md:text-6xl font-mono font-bold text-primary">
                      {formatTimerDisplay(currentSessionTime)}
                    </div>
                  )}
                  <div className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-1">
                    {loading ? "Loading..." : (isTracking ? "Elapsed Time" : "Session Time")}
                  </div>
                </div>

                <div className="flex justify-center">
                  {loading ? (
                    <Button size="lg" className="gap-2 rounded-full w-16 h-16 md:w-16 md:h-16 p-0" disabled>
                      <Clock className="w-6 h-6 md:w-6 md:h-6 animate-spin" />
                    </Button>
                  ) : !isTracking ? (
                    <div className="relative">
                      <Button onClick={handleTimeIn} size="lg" className="gap-2 rounded-full w-20 h-20 md:w-24 md:h-24 p-0 cursor-pointer relative overflow-hidden" disabled={buttonCooldown}>
                        <span className="text-4xl md:text-5xl font-bold relative z-10">▶</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Button id="stop-tracking-btn" onClick={handleTimeOut} size="lg" className="gap-2 rounded-full w-20 h-20 md:w-24 md:h-24 p-0 cursor-pointer relative overflow-hidden bg-red-600 hover:bg-red-700 text-white" disabled={buttonCooldown}>
                        <span className="text-4xl md:text-5xl font-bold relative z-10">⏹</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
