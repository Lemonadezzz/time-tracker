"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, ChevronLeft, ChevronRight, Filter, Clock, Download, FileText, X } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import TeamTimeTable from "@/components/team-time-table"
import { formatDuration } from "@/lib/utils"
import { exportTimeEntriesToExcel } from "@/lib/exportUtils"
import { timeEntriesService } from "@/lib/timeEntries"

interface TeamTimeEntry {
  _id?: string
  username: string
  date: string
  timeIn: string
  timeOut: string | null
  duration: number
}

interface TeamLog {
  _id: string
  username: string
  action: 'time_in' | 'time_out'
  timestamp: string
  location: string
  ipAddress: string
}

interface User {
  _id: string
  username: string
}

export default function TeamReportsPage() {
  const [timeEntries, setTimeEntries] = useState<TeamTimeEntry[]>([])
  const [teamLogs, setTeamLogs] = useState<TeamLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotalPages, setLogsTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)
  const [entriesPerPage, setEntriesPerPage] = useState(30)
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest')
  const [logsSortOrder, setLogsSortOrder] = useState<'latest' | 'oldest'>('latest')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [logsSelectedUser, setLogsSelectedUser] = useState<string>('all')
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('teamTimesheetsActiveTab') || 'timesheets'
    }
    return 'timesheets'
  })

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

  const [logsDateRange, setLogsDateRange] = useState(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start: startOfMonth.toLocaleDateString("en-CA"),
      end: endOfMonth.toLocaleDateString("en-CA")
    }
  })

  useEffect(() => {
    loadUsers()
  }, [])

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
  }, [dateRange, selectedUser])
  
  useEffect(() => {
    loadTimeEntries()
  }, [currentPage, entriesPerPage, sortOrder])

  useEffect(() => {
    loadTeamLogs()
  }, [logsPage, entriesPerPage, logsSortOrder, logsDateRange, logsSelectedUser])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const loadTimeEntries = async () => {
    try {
      setLoading(true)
      const { entries, pagination } = await timeEntriesService.getAllEntries({
        page: currentPage,
        limit: entriesPerPage,
        startDate: dateRange.start,
        endDate: dateRange.end,
        sort: sortOrder,
        user: selectedUser
      })
      
      setTimeEntries(entries)
      setTotalPages(pagination.totalPages)
    } catch (error) {
      console.error('Failed to load time entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamLogs = async () => {
    try {
      setLogsLoading(true)
      const token = localStorage.getItem('authToken')
      const searchParams = new URLSearchParams()
      searchParams.set('page', logsPage.toString())
      searchParams.set('limit', entriesPerPage.toString())
      searchParams.set('sort', logsSortOrder)
      if (logsDateRange.start) searchParams.set('startDate', logsDateRange.start)
      if (logsDateRange.end) searchParams.set('endDate', logsDateRange.end)
      if (logsSelectedUser) searchParams.set('user', logsSelectedUser)
      
      const response = await fetch(`/api/team-action-logs?${searchParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setTeamLogs(data.logs || [])
      setLogsTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to load team logs:', error)
    } finally {
      setLogsLoading(false)
    }
  }



  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleLogsPageChange = (page: number) => {
    setLogsPage(page)
  }

  const handlePageSizeChange = (size: string) => {
    setEntriesPerPage(Number(size))
    setCurrentPage(1) // Reset to first page
  }

  const getTotalTime = () => {
    return timeEntries.reduce((total, entry) => total + entry.duration, 0)
  }

  const exportToExcel = () => {
    if (!timeEntries || timeEntries.length === 0) {
      toast.error("Export failed", {
        description: (
          <div>
            <div>No data to export</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
      return
    }

    try {
      exportTimeEntriesToExcel(timeEntries, 'team-reports', true)
      toast.success("CSV exported", {
        description: (
          <div>
            <div>Team timesheet downloaded successfully</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-green-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
    } catch (error) {
      toast.error("Export failed", {
        description: (
          <div>
            <div>Failed to download CSV file</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
    }
  }

  const exportLogsToExcel = () => {
    if (!teamLogs || teamLogs.length === 0) {
      toast.error("Export failed", {
        description: (
          <div>
            <div>No data to export</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
      return
    }

    try {
      const logsData = teamLogs.map(log => ({
        Username: log.username,
        Action: log.action === 'time_in' ? 'Time In' : 'Time Out',
        'Date & Time': new Date(log.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
        Location: log.location,
        'IP Address': log.ipAddress
      }))
      
      const XLSX = require('xlsx')
      const ws = XLSX.utils.json_to_sheet(logsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Team Clock Logs')
      XLSX.writeFile(wb, `team-clock-logs-${new Date().toISOString().split('T')[0]}.xlsx`)
      
      toast.success("CSV exported", {
        description: (
          <div>
            <div>Team clock logs downloaded successfully</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-green-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
    } catch (error) {
      toast.error("Export failed", {
        description: (
          <div>
            <div>Failed to download CSV file</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
    }
  }

  const totalTime = getTotalTime()

  return (
    <div className="h-screen bg-background p-3 md:p-6 md:pt-6 flex flex-col">
      <div className="max-w-6xl md:mx-auto w-full flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 md:pb-6 flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-base md:text-xl">Team Timesheets</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value)
              localStorage.setItem('teamTimesheetsActiveTab', value)
            }} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="timesheets">Daily Records</TabsTrigger>
                <TabsTrigger value="logs">Clock Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timesheets" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 flex flex-col">
              {/* Filters */}
              <div className="flex flex-col md:flex-row items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user._id} value={user.username}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  {(() => {
                    const now = new Date()
                    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("en-CA")
                    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString("en-CA")
                    const isDefault = dateRange.start === currentMonthStart && dateRange.end === currentMonthEnd && selectedUser === 'all'
                    
                    return !isDefault && (
                      <Button variant="destructive" size="sm" onClick={() => {
                        const now = new Date()
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                        setDateRange({
                          start: startOfMonth.toLocaleDateString("en-CA"),
                          end: endOfMonth.toLocaleDateString("en-CA")
                        })
                        setSelectedUser('all')
                        setSortOrder('latest')
                        setCurrentPage(1)
                      }}>
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )
                  })()}
                </div>
              </div>
              
              <div className="flex-1 min-h-0 mt-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p>Loading team entries...</p>
                  </div>
                ) : (
                  <TeamTimeTable entries={timeEntries} />
                )}
              </div>
              
              {/* Pagination Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <Select value={entriesPerPage.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-20 h-8">
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
              </TabsContent>
              
              <TabsContent value="logs" className="flex-1 flex flex-col mt-0">
                <div className="flex-1 flex flex-col">
                  {/* Filters for Logs */}
                  <div className="flex flex-col md:flex-row items-center gap-3 p-3 bg-muted/20 rounded-lg mb-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <span className="text-sm font-medium">Filters:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={logsSelectedUser} onValueChange={setLogsSelectedUser}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user.username}>
                              {user.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={logsDateRange.start}
                        onChange={(e) => setLogsDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-auto"
                        placeholder="Start date"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="date"
                        value={logsDateRange.end}
                        onChange={(e) => setLogsDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-auto"
                        placeholder="End date"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={logsSortOrder} onValueChange={(value: 'latest' | 'oldest') => setLogsSortOrder(value)}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="latest">Latest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={exportLogsToExcel}>
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                      {(() => {
                        const now = new Date()
                        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("en-CA")
                        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString("en-CA")
                        const isDefault = logsDateRange.start === currentMonthStart && logsDateRange.end === currentMonthEnd && logsSelectedUser === 'all'
                        
                        return !isDefault && (
                          <Button variant="destructive" size="sm" onClick={() => {
                            const now = new Date()
                            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                            setLogsDateRange({
                              start: startOfMonth.toLocaleDateString("en-CA"),
                              end: endOfMonth.toLocaleDateString("en-CA")
                            })
                            setLogsSelectedUser('all')
                            setLogsSortOrder('latest')
                            setLogsPage(1)
                          }}>
                            <X className="w-4 h-4 mr-1" />
                            Clear
                          </Button>
                        )
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-0">
                    {logsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
                        <p>Loading team logs...</p>
                      </div>
                    ) : teamLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No team logs for this period</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="h-[calc(100vh-300px)] overflow-y-auto overflow-x-auto">
                          {/* Desktop Table */}
                          <table className="hidden md:table min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date & Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">IP Address</th>
                              </tr>
                            </thead>
                            <tbody className="bg-background divide-y divide-border">
                              {teamLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-muted/50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{log.username}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <Badge variant={log.action === 'time_in' ? 'default' : 'secondary'} className="text-xs">
                                      {log.action === 'time_in' ? 'Time In' : 'Time Out'}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {new Date(log.timestamp).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: true
                                    })}
                                  </td>
                                  <td className="px-4 py-3 text-sm truncate max-w-xs">{log.location}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">{log.ipAddress}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {/* Mobile List */}
                          <div className="md:hidden divide-y divide-border">
                            {teamLogs.map((log) => (
                              <div key={log._id} className="p-3 hover:bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium text-sm">{log.username}</div>
                                  <Badge variant={log.action === 'time_in' ? 'default' : 'secondary'} className="text-xs">
                                    {log.action === 'time_in' ? 'Time In' : 'Time Out'}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t flex-shrink-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Show</span>
                      <Select value={entriesPerPage.toString()} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="w-20 h-8">
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
                    
                    {logsTotalPages > 1 && (
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-muted-foreground">
                          Page {logsPage} of {logsTotalPages}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogsPageChange(logsPage - 1)}
                            disabled={logsPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden md:inline">Previous</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogsPageChange(logsPage + 1)}
                            disabled={logsPage === logsTotalPages}
                          >
                            <span className="hidden md:inline">Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}