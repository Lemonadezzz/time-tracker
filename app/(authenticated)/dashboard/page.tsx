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
    }, 1000) // Update every second
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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        {/* Active Timers Card */}
        <Card>
          <CardHeader className="pb-4 md:pb-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                <span className="text-lg md:text-xl">Active Timers</span>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex">
                {activeSessions.length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>Loading active timers...</p>
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users are currently tracking time</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session, index) => {
                  const duration = calculateDuration(session.startTime)
                  const startTime = new Date(session.startTime)
                  
                  return (
                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{session.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Started {startTime.toLocaleTimeString("en-US", {
                            hour12: true,
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono">{formatDuration(duration)}</p>
                        <p className="text-xs text-muted-foreground">elapsed</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}