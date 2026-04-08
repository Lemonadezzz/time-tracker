"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Clock, Play } from "lucide-react"
import { formatDuration } from "@/lib/utils"

interface ActiveSession {
  userId: string
  username: string
  startTime: string
  location?: string
  createdAt: string
}

export default function DashboardPage() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadActiveSessions()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadActiveSessions = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/active-sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setActiveSessions(data.activeSessions || [])
    } catch (error) {
      console.error('Failed to load active sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (startTime: string) => {
    if (!startTime) return 0
    const start = new Date(startTime)
    return Math.floor((currentTime.getTime() - start.getTime()) / 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        </div>

        {/* Active Timers Card */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center justify-between text-base md:text-xl">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                <span>Active Timers</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {activeSessions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-4 animate-spin" />
                <p className="text-sm md:text-base">Loading active timers...</p>
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base">No users are currently tracking time</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-2">
                {activeSessions.map((session, index) => {
                  const duration = calculateDuration(session.startTime)
                  const startTime = new Date(session.startTime)
                  
                  return (
                    <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 py-3 border-b last:border-b-0">
                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{session.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Started {startTime.toLocaleTimeString("en-US", {
                            hour12: true,
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      
                      {/* Location */}
                      <div className="flex-1 min-w-0 md:text-center">
                        <p className="text-xs md:text-sm truncate">
                          📍 {session.location || 'Location Unavailable'}
                        </p>
                      </div>
                      
                      {/* Duration */}
                      <div className="md:text-right">
                        <p className="font-mono text-lg md:text-base font-semibold">{formatDuration(duration)}</p>
                        <p className="text-xs text-muted-foreground">elapsed</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Activity Heatmap */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-xl">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              <span>Team Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <ActivityHeatmap />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ActivityHeatmap() {
  const [activityData, setActivityData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    loadActivityData()
    
    // Check initial screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const loadActivityData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/team-activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setActivityData(data.activityData || [])
    } catch (error) {
      console.error('Failed to load activity data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCalendarData = () => {
    const today = new Date()
    
    // Mobile: show last 3 months, Desktop: show full year
    const startDate = new Date()
    if (isMobile) {
      startDate.setMonth(startDate.getMonth() - 3)
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1)
    }
    
    const weeks = []
    const current = new Date(startDate)
    
    // Start from the first Sunday
    current.setDate(current.getDate() - current.getDay())
    
    while (current <= today) {
      const week = []
      for (let i = 0; i < 7; i++) {
        const dateStr = current.toISOString().split('T')[0]
        const dayData = activityData.find(d => d.date === dateStr)
        
        week.push({
          date: new Date(current),
          hours: dayData?.totalHours || 0,
          users: dayData?.activeUsers || 0
        })
        
        current.setDate(current.getDate() + 1)
      }
      weeks.push(week)
    }
    
    return weeks
  }

  const getIntensityClass = (users: number) => {
    if (users === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (users === 1) return 'bg-green-200 dark:bg-green-900'
    if (users === 2) return 'bg-green-300 dark:bg-green-700'
    if (users === 3) return 'bg-green-400 dark:bg-green-600'
    return 'bg-green-500 dark:bg-green-500'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading activity data...</p>
      </div>
    )
  }

  const weeks = generateCalendarData()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="w-full">
      <div className="w-full flex justify-center md:justify-start">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-2 md:mb-3 ml-8 md:ml-12">
            {weeks.map((week, weekIndex) => {
              const firstDay = week[0].date
              const showMonth = firstDay.getDate() <= 7
              return (
                <div key={weekIndex} className="w-3 md:w-3.5 text-[10px] md:text-xs text-muted-foreground text-center mr-0.5 md:mr-1">
                  {showMonth ? months[firstDay.getMonth()].slice(0, 3) : ''}
                </div>
              )
            })}
          </div>
          
          {/* Calendar grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-2 md:mr-3 w-6 md:w-9">
              {days.map((day, index) => (
                <div key={day} className="h-3 md:h-3.5 mb-0.5 md:mb-1 text-[10px] md:text-xs text-muted-foreground flex items-center justify-end">
                  {index % 2 === 1 ? day.slice(0, 1) : ''}
                </div>
              ))}
            </div>
            
            {/* Activity squares */}
            <div className="flex gap-0.5 md:gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5 md:gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 md:w-3.5 md:h-3.5 ${getIntensityClass(day.users)} cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all rounded-sm`}
                      title={`${day.date.toDateString()}: ${day.users} users, ${day.hours.toFixed(1)}h total`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground mt-3 md:mt-6">
        <span>Less</span>
        <div className="flex gap-0.5 md:gap-1">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
          <div className="w-3 h-3 md:w-4 md:h-4 bg-green-200 dark:bg-green-900 rounded-sm"></div>
          <div className="w-3 h-3 md:w-4 md:h-4 bg-green-300 dark:bg-green-700 rounded-sm"></div>
          <div className="w-3 h-3 md:w-4 md:h-4 bg-green-400 dark:bg-green-600 rounded-sm"></div>
          <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 dark:bg-green-500 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  )
}