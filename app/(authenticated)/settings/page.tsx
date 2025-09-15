"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Terminal, Activity, Clock, Calendar } from "lucide-react"

interface SystemLog {
  _id: string
  action: string
  details: string
  username: string
  timestamp: string
  ip: string
}

export default function SettingsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFormat, setTimeFormat] = useState<'12' | '24'>('12')
  const [dateFormat, setDateFormat] = useState<'US' | 'EU' | 'ISO'>('US')
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const LIMIT = 25

  useEffect(() => {
    loadSystemLogs(true)
    const interval = setInterval(() => loadSystemLogs(true), 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const savedTimeFormat = localStorage.getItem('timeFormat') as '12' | '24'
    if (savedTimeFormat) {
      setTimeFormat(savedTimeFormat)
    }
    const savedDateFormat = localStorage.getItem('dateFormat') as 'US' | 'EU' | 'ISO'
    if (savedDateFormat) {
      setDateFormat(savedDateFormat)
    }
  }, [])

  const handleTimeFormatChange = (format: '12' | '24') => {
    setTimeFormat(format)
    localStorage.setItem('timeFormat', format)
    window.dispatchEvent(new CustomEvent('timeFormatChanged', { detail: format }))
  }

  const handleDateFormatChange = (format: 'US' | 'EU' | 'ISO') => {
    setDateFormat(format)
    localStorage.setItem('dateFormat', format)
    window.dispatchEvent(new CustomEvent('dateFormatChanged', { detail: format }))
  }

  const loadSystemLogs = async (reset = false) => {
    try {
      const token = localStorage.getItem('authToken')
      const currentOffset = reset ? 0 : offset
      const response = await fetch(`/api/system-logs?limit=${LIMIT}&offset=${currentOffset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      const newLogs = data.logs || []
      
      if (reset) {
        setLogs(newLogs)
        setOffset(LIMIT)
      } else {
        setLogs(prev => [...prev, ...newLogs])
        setOffset(prev => prev + LIMIT)
      }
      
      setHasMore(newLogs.length === LIMIT)
    } catch (error) {
      console.error('Failed to load system logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return 'text-green-400'
      case 'logout': return 'text-yellow-400'
      case 'create': return 'text-blue-400'
      case 'edit': return 'text-orange-400'
      case 'delete': return 'text-red-400'
      case 'timer_start': return 'text-green-300'
      case 'timer_stop': return 'text-red-300'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Format Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Time Format */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-lg">Time Format</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="space-y-3">
                <span className="text-sm text-muted-foreground">Choose your preferred time format:</span>
                <div className="flex gap-2">
                  <Button
                    variant={timeFormat === '12' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTimeFormatChange('12')}
                  >
                    12-hour
                  </Button>
                  <Button
                    variant={timeFormat === '24' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTimeFormatChange('24')}
                  >
                    24-hour
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Format */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="text-lg">Date Format</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="space-y-3">
                <span className="text-sm text-muted-foreground">Choose your preferred date format:</span>
                <div className="flex gap-2">
                  <Button
                    variant={dateFormat === 'US' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateFormatChange('US')}
                  >
                    US (MM/DD/YYYY)
                  </Button>
                  <Button
                    variant={dateFormat === 'EU' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateFormatChange('EU')}
                  >
                    EU (DD/MM/YYYY)
                  </Button>
                  <Button
                    variant={dateFormat === 'ISO' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateFormatChange('ISO')}
                  >
                    ISO (YYYY-MM-DD)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Logs Terminal */}
        <Card>
          <CardHeader className="pb-4 md:pb-6">
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              <span className="text-lg md:text-xl">System Activity Log</span>
              <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {loading ? (
                <div className="text-green-400">
                  <span className="animate-pulse">$ </span>Loading system logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="text-gray-500">
                  <span className="text-green-400">$ </span>No system activity logged yet
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div key={log._id} className="text-gray-300">
                      <span className="text-gray-500">[{formatTimestamp(log.timestamp)}]</span>
                      <span className="text-blue-400"> {log.username}</span>
                      <span className={getActionColor(log.action)}> {log.action.toUpperCase()}</span>
                      <span className="text-gray-300"> {log.details}</span>
                      <span className="text-gray-600"> ({log.ip})</span>
                    </div>
                  ))}
                  {hasMore && !loading && (
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => loadSystemLogs()}
                        className="text-xs bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                  <div className="text-green-400 animate-pulse">
                    <span>$ </span>Monitoring system activity...
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}