"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import TeamTimeTable from "@/components/TeamTimeTable"
import { formatDuration } from "@/lib/utils"

interface TeamTimeEntry {
  _id?: string
  username: string
  date: string
  timeIn: string
  timeOut: string | null
  duration: number
}

export default function TeamReportsPage() {
  const [teamEntries, setTeamEntries] = useState<TeamTimeEntry[]>([])
  const [activeTab, setActiveTab] = useState("today")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamEntries()
  }, [])

  const loadTeamEntries = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/team-entries', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setTeamEntries(data.entries || [])
    } catch (error) {
      console.error('Failed to load team entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredEntries = (period: string) => {
    const now = new Date()
    const today = now.toLocaleDateString("en-CA")

    switch (period) {
      case "today":
        return teamEntries.filter((entry) => entry.date === today)
      case "week":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekStartStr = weekStart.toLocaleDateString("en-CA")
        return teamEntries.filter((entry) => entry.date >= weekStartStr)
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthStartStr = monthStart.toLocaleDateString("en-CA")
        return teamEntries.filter((entry) => entry.date >= monthStartStr)
      default:
        return teamEntries
    }
  }

  const getTotalTime = (entries: TeamTimeEntry[]) => {
    return entries.reduce((total, entry) => total + entry.duration, 0)
  }

  const filteredEntries = getFilteredEntries(activeTab)
  const totalTime = getTotalTime(filteredEntries)

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Team Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading team reports...</p>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                  <TabsTrigger value="month">This Month</TabsTrigger>
                </TabsList>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {activeTab === "today" && "Today's Team Hours"}
                      {activeTab === "week" && "This Week's Team Hours"}
                      {activeTab === "month" && "This Month's Team Hours"}
                    </h3>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {formatDuration(totalTime)}
                    </Badge>
                  </div>

                  <TabsContent value="today" className="mt-0">
                    <TeamTimeTable entries={getFilteredEntries("today")} />
                  </TabsContent>

                  <TabsContent value="week" className="mt-0">
                    <TeamTimeTable entries={getFilteredEntries("week")} />
                  </TabsContent>

                  <TabsContent value="month" className="mt-0">
                    <TeamTimeTable entries={getFilteredEntries("month")} />
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}