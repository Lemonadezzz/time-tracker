"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Terminal, Activity } from "lucide-react"

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

  useEffect(() => {
    loadSystemLogs()
    const interval = setInterval(loadSystemLogs, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadSystemLogs = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/system-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setLogs(data.logs || [])
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