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
    // Apply same consolidation logic as in TimeTable component
    const isValidTime = (timeStr: string) => {
      const [hourMin, ampm] = timeStr.split(' ')
      let [hour, minute] = hourMin.split(':').map(Number)
      if (ampm === 'PM' && hour !== 12) hour += 12
      if (ampm === 'AM' && hour === 12) hour = 0
      const totalMinutes = hour * 60 + minute
      return totalMinutes >= 360 && totalMinutes <= 1320
    }

    const validEntries = entries.filter(entry => {
      const validTimeIn = isValidTime(entry.timeIn)
      const validTimeOut = entry.timeOut ? isValidTime(entry.timeOut) : false
      return validTimeIn && validTimeOut
    })

    const mergedEntries = validEntries.reduce((acc, entry) => {
      const key = entry.date
      if (!acc[key]) {
        acc[key] = {
          timeIns: [entry.timeIn],
          timeOuts: entry.timeOut ? [entry.timeOut] : []
        }
      } else {
        acc[key].timeIns.push(entry.timeIn)
        if (entry.timeOut) acc[key].timeOuts.push(entry.timeOut)
      }
      return acc
    }, {} as Record<string, any>)

    const parseTimeForSort = (timeStr: string) => {
      const [hourMin, ampm] = timeStr.split(' ')
      let [hour, minute] = hourMin.split(':').map(Number)
      if (ampm === 'PM' && hour !== 12) hour += 12
      if (ampm === 'AM' && hour === 12) hour = 0
      return hour * 60 + minute
    }

    return Object.values(mergedEntries).reduce((total, entry: any) => {
      const sortedTimeIns = entry.timeIns.sort((a: string, b: string) => 
        parseTimeForSort(a) - parseTimeForSort(b)
      )
      const sortedTimeOuts = entry.timeOuts.sort((a: string, b: string) => 
        parseTimeForSort(a) - parseTimeForSort(b)
      )
      
      const earliestTimeIn = sortedTimeIns[0]
      const latestTimeOut = sortedTimeOuts.length > 0 ? sortedTimeOuts[sortedTimeOuts.length - 1] : null
      
      if (earliestTimeIn && latestTimeOut) {
        const startMinutes = parseTimeForSort(earliestTimeIn)
        const endMinutes = parseTimeForSort(latestTimeOut)
        const duration = (endMinutes - startMinutes) * 60
        return total + duration
      }
      return total
    }, 0)
  }

  const filteredEntries = getFilteredEntries(activeTab)
  const totalTime = getTotalTime(filteredEntries)

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        <Card>
          <CardHeader className="pb-4 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Calendar className="w-5 h-5" />
              Time Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-base md:text-lg font-semibold">
                    {activeTab === "today" && "Today's Hours"}
                    {activeTab === "week" && "This Week's Hours"}
                    {activeTab === "month" && "This Month's Hours"}
                  </h3>
                  <Badge variant="secondary" className="text-sm md:text-lg px-3 py-1 self-start sm:self-auto hidden md:inline-flex">
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