/**
 * Timer Page - Refactored with Feature-Sliced Design
 * Clean composition of widgets and features
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { TimerWidget } from "@/widgets/timer-widget"
import DayTimeline from "@/components/day-timeline"
import { timeEntryApi } from "@/entities/time-entry"
import { useSessionStore } from "@/entities/session"

export default function TimerPageRefactored() {
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [location, setLocation] = useState<string>('')
  const [locality, setLocality] = useState<string>('')
  const [principalSubdivision, setPrincipalSubdivision] = useState<string>('')
  const [currentTime, setCurrentTime] = useState(new Date())
  
  const { isTracking, isOnBreak, sessionStart, currentSessionTime, completedBreakPeriods } = useSessionStore()

  // Load time entries
  useEffect(() => {
    loadTimeEntries()
  }, [])

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Get user location
  useEffect(() => {
    getUserLocation()
  }, [])

  const loadTimeEntries = async () => {
    try {
      const { entries } = await timeEntryApi.getEntries()
      setTimeEntries(entries)
    } catch (error) {
      console.error('Failed to load time entries:', error)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocation('Geolocation not supported')
      setLocality('Location Unavailable')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Get location
          const locationResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const locationData = await locationResponse.json()
          const localityData = locationData.locality || 'Unknown Locality'
          const regionData = locationData.principalSubdivision || 'Unknown Region'

          setLocality(localityData)
          setPrincipalSubdivision(regionData)

          // Get weather
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`
          )
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

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getTodayEntries = () => {
    const today = new Date().toLocaleDateString("en-CA")
    const todayConsolidated = timeEntries.find((entry) => entry.date === today)
    const individualEntries = (todayConsolidated?.entries || []).map(entry => ({
      ...entry,
      date: today,
      breakPeriods: entry.breakPeriods || todayConsolidated?.breakPeriods || []
    }))

    // If currently tracking, add live session
    if (isTracking && sessionStart) {
      const liveEntry = {
        _id: 'live-session',
        date: today,
        timeIn: sessionStart.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        }),
        timeOut: null,
        duration: currentSessionTime,
        isOnBreak: isOnBreak,
        breakPeriods: completedBreakPeriods
      }
      return [...individualEntries, liveEntry]
    }

    return individualEntries
  }

  const todayEntries = getTodayEntries()
  const fullLocation = locality && principalSubdivision 
    ? `${locality}, ${principalSubdivision}` 
    : 'Location Unavailable'

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile only */}
      <div className="md:hidden bg-card">
        <div className="px-3 py-4">
          <h1 className="text-xl font-bold text-foreground">
            {getGreeting()}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {location || 'Getting your location...'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Greeting - Desktop only */}
        <div className="hidden md:block text-left px-1">
          <h1 className="text-3xl font-bold text-foreground">
            {getGreeting()}!
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            {location || 'Getting your location...'}
          </p>
        </div>

        {/* Timer Widget */}
        <TimerWidget 
          location={fullLocation} 
          onSessionEnd={loadTimeEntries}
        />

        {/* Timeline */}
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
                {/* Mobile: Total time */}
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
                {/* Desktop: Timeline */}
                <div className="hidden md:block">
                  <DayTimeline 
                    entries={todayEntries.map(e => ({ 
                      ...e, 
                      id: e._id || e.date + e.timeIn 
                    }))} 
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
