"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight, Filter, Clock, Download } from "lucide-react"
import TimeTable from "@/components/time-table"
import { formatDuration } from "@/lib/utils"
import * as XLSX from 'xlsx'
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
      const { entries, pagination } = await timeEntriesService.getEntries({
        page: currentPage,
        limit: entriesPerPage,
        startDate: dateRange.start,
        endDate: dateRange.end,
        sort: sortOrder
      })
      
      setTimeEntries(entries)
      setTotalPages(pagination.totalPages)
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





  const getTotalTime = () => {
    return timeEntries.reduce((total, entry) => total + entry.duration, 0)
  }

  const exportToExcel = () => {
    const exportData = timeEntries.map(entry => {
      // Detect if duration is in seconds (>1440) or minutes
      const durationInMinutes = entry.duration > 1440 ? Math.floor(entry.duration / 60) : entry.duration
      const hours = Math.floor(durationInMinutes / 60)
      const minutes = durationInMinutes % 60
      const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      
      return {
        Date: entry.date,
        'Time In': entry.timeIn,
        'Time Out': entry.timeOut || '-',
        Duration: durationText
      }
    })
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Time Entries')
    XLSX.writeFile(wb, `time-entries-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const totalTime = getTotalTime()

  return (
    <div className="h-screen bg-background p-3 md:p-6 md:pt-6 flex flex-col">
      <div className="max-w-6xl md:mx-auto w-full flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 md:pb-6 flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-base md:text-xl">My Timesheets</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col">
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
                  {(() => {
                    const now = new Date()
                    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("en-CA")
                    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString("en-CA")
                    const isDefault = dateRange.start === currentMonthStart && dateRange.end === currentMonthEnd
                    
                    return !isDefault && (
                      <Button variant="outline" size="sm" onClick={() => {
                        const now = new Date()
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                        setDateRange({
                          start: startOfMonth.toLocaleDateString("en-CA"),
                          end: endOfMonth.toLocaleDateString("en-CA")
                        })
                        setSortOrder('latest')
                        setCurrentPage(1)
                      }}>
                        Clear
                      </Button>
                    )
                  })()}
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0 mt-3">
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
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t flex-shrink-0">
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