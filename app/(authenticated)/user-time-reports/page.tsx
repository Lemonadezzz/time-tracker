"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight, Filter, Clock } from "lucide-react"
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

export default function UserTimeReportsPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [entriesPerPage, setEntriesPerPage] = useState(30)
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest')

  // Default to current month
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start: startOfMonth.toLocaleDateString("en-CA"),
      end: endOfMonth.toLocaleDateString("en-CA")
    }
  })

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // If both dates are cleared, default back to current month
      if (!dateRange.start && !dateRange.end) {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setDateRange({
          start: startOfMonth.toLocaleDateString("en-CA"),
          end: endOfMonth.toLocaleDateString("en-CA")
        })
        return
      }
      
      setCurrentPage(1) // Reset to first page when date range changes
      loadTimeEntries()
    }, 300) // Debounce date changes
    
    return () => clearTimeout(timeoutId)
  }, [dateRange])
  
  useEffect(() => {
    loadTimeEntries()
  }, [currentPage, entriesPerPage, sortOrder])

  const loadTimeEntries = async () => {
    try {
      setLoading(true)
      const entries = await timeEntriesService.getEntries()
      
      // Filter entries by date range
      const filteredEntries = entries.filter(entry => 
        entry.date >= dateRange.start && entry.date <= dateRange.end
      )
      
      // Consolidate entries by date (same logic as TimeTable)
      const consolidatedEntries = consolidateEntriesByDate(filteredEntries)
      
      // Sort by date based on selected order
      const sortedEntries = consolidatedEntries.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortOrder === 'latest' ? dateB - dateA : dateA - dateB
      })
      
      // Calculate pagination
      const totalEntries = sortedEntries.length
      const totalPagesCalc = Math.ceil(totalEntries / entriesPerPage)
      
      // Ensure current page is valid
      const validCurrentPage = Math.min(currentPage, Math.max(1, totalPagesCalc))
      if (validCurrentPage !== currentPage) {
        setCurrentPage(validCurrentPage)
        return // Will trigger another load with correct page
      }
      
      setTotalPages(totalPagesCalc)
      
      // Get current page entries
      const startIndex = (validCurrentPage - 1) * entriesPerPage
      const endIndex = Math.min(startIndex + entriesPerPage, totalEntries)
      const pageEntries = sortedEntries.slice(startIndex, endIndex)
      

      
      setTimeEntries(pageEntries)
    } catch (error) {
      console.error('Failed to load time entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: string) => {
    setEntriesPerPage(Number(size))
    setCurrentPage(1) // Reset to first page
  }



  const consolidateEntriesByDate = (entries: TimeEntry[]) => {
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
          ...entry,
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

    return Object.values(mergedEntries).map((entry: any) => {
      const sortedTimeIns = entry.timeIns.sort((a: string, b: string) => 
        parseTimeForSort(a) - parseTimeForSort(b)
      )
      const sortedTimeOuts = entry.timeOuts.sort((a: string, b: string) => 
        parseTimeForSort(a) - parseTimeForSort(b)
      )
      
      const earliestTimeIn = sortedTimeIns[0]
      const latestTimeOut = sortedTimeOuts.length > 0 ? sortedTimeOuts[sortedTimeOuts.length - 1] : null
      
      let actualDuration = 0
      if (earliestTimeIn && latestTimeOut) {
        const startMinutes = parseTimeForSort(earliestTimeIn)
        const endMinutes = parseTimeForSort(latestTimeOut)
        actualDuration = (endMinutes - startMinutes) * 60
      }
      
      return {
        _id: entry._id,
        date: entry.date,
        timeIn: earliestTimeIn,
        timeOut: latestTimeOut,
        duration: actualDuration
      }
    })
  }

  const getTotalTime = () => {
    return timeEntries.reduce((total, entry) => total + entry.duration, 0)
  }

  const totalTime = getTotalTime()

  return (
    <div className="h-screen bg-background p-3 md:p-6 md:pt-6 flex flex-col">
      <div className="max-w-6xl md:mx-auto w-full flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 md:pb-6 flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-base md:text-xl">My Timesheets</span>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex">
                {formatDuration(totalTime)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col space-y-3">
              {/* Date Range Filter */}
              <div className="flex flex-col md:flex-row items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filter by date:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-auto"
                    placeholder="Start date"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-auto"
                    placeholder="End date"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={sortOrder} onValueChange={(value: 'latest' | 'oldest') => setSortOrder(value)}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => {
                    setDateRange({
                      start: new Date().toLocaleDateString("en-CA"),
                      end: new Date().toLocaleDateString("en-CA")
                    })
                    setCurrentPage(1)
                  }}>
                    Today
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p>Loading time entries...</p>
                  </div>
                ) : (
                  <TimeTable entries={timeEntries} />
                )}
              </div>
              
              {/* Pagination Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3 border-t flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <Select value={entriesPerPage.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>entries</span>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden md:inline">Previous</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <span className="hidden md:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}