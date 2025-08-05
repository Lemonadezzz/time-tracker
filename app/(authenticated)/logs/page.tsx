"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import TimeTable from "@/components/time-table"
import { formatDuration } from "@/lib/utils"
import { timeEntriesService } from "@/lib/timeEntries"

interface TimeEntry {
  _id?: string
  date: string
  timeIn: string
  timeOut: string | null
  duration: number
}

export default function TimeReportsPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [activeTab, setActiveTab] = useState("today")

  useEffect(() => {
    loadTimeEntries()
  }, [])

  const loadTimeEntries = async () => {
    try {
      const entries = await timeEntriesService.getEntries()
      setTimeEntries(entries)
    } catch (error) {
      console.error('Failed to load time entries:', error)
    }
  }

  const getFilteredEntries = (period: string) => {
    const now = new Date()
    const today = now.toLocaleDateString("en-CA")

    switch (period) {
      case "today":
        return timeEntries.filter((entry) => entry.date === today)
      case "week":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekStartStr = weekStart.toLocaleDateString("en-CA")
        return timeEntries.filter((entry) => entry.date >= weekStartStr)
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthStartStr = monthStart.toLocaleDateString("en-CA")
        return timeEntries.filter((entry) => entry.date >= monthStartStr)
      default:
        return timeEntries
    }
  }

  const getTotalTime = (entries: TimeEntry[]) => {
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
              <Calendar className="w-5 h-5" />
              Time Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {activeTab === "today" && "Today's Hours"}
                    {activeTab === "week" && "This Week's Hours"}
                    {activeTab === "month" && "This Month's Hours"}
                  </h3>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {formatDuration(totalTime)}
                  </Badge>
                </div>

                <TabsContent value="today" className="mt-0">
                  <TimeTable entries={getFilteredEntries("today")} />
                </TabsContent>

                <TabsContent value="week" className="mt-0">
                  <TimeTable entries={getFilteredEntries("week")} />
                </TabsContent>

                <TabsContent value="month" className="mt-0">
                  <TimeTable entries={getFilteredEntries("month")} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}