"use client"

import { useState, Fragment, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, ChevronDown, ChevronRight } from "lucide-react"
import { formatDuration, formatDate as formatDateUtil } from "@/lib/utils"
import DayTimeline from "@/components/day-timeline"

interface TimeEntry {
  _id?: string
  date: string // YYYY-MM-DD
  timeIn: string // HH:MM AM/PM
  timeOut: string | null // HH:MM AM/PM
  duration: number // in seconds
}

interface TimeTableProps {
  entries: TimeEntry[]
}

export default function TimeTable({ entries }: TimeTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const handleDateFormatChange = () => forceUpdate({})
    window.addEventListener('dateFormatChanged', handleDateFormatChange)
    return () => window.removeEventListener('dateFormatChanged', handleDateFormatChange)
  }, [])



  const formatTime = (timeStr: string) => {
    if (!timeStr) return timeStr
    const userFormat = localStorage.getItem('timeFormat') || '12'
    
    if (userFormat === '24') {
      // Convert to 24-hour format if needed
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [hourMin, ampm] = timeStr.split(' ')
        let [hour, minute] = hourMin.split(':').map(Number)
        if (ampm === 'PM' && hour !== 12) hour += 12
        if (ampm === 'AM' && hour === 12) hour = 0
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }
      return timeStr
    } else {
      // Convert to 12-hour format if needed
      if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
      const [hour, minute] = timeStr.split(':')
      const hourNum = parseInt(hour)
      const ampm = hourNum >= 12 ? 'PM' : 'AM'
      const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
      return `${hour12}:${minute} ${ampm}`
    }
  }

  const toggleRow = (entryId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
    }
    setExpandedRows(newExpanded)
  }

  const getEntriesForDate = (date: string) => {
    const dayEntry = entries.find(entry => entry.date === date)
    return dayEntry?.entries || []
  }

  // Use entries as-is since API already provides consolidated data with correct duration
  const consolidatedEntries = entries

  if (consolidatedEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No time entries for this period</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="h-[calc(100vh-300px)] overflow-y-auto overflow-x-auto">
        <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[110px]">Time In</TableHead>
            <TableHead className="w-[110px]">Time Out</TableHead>
            <TableHead className="w-[110px] hidden md:table-cell">Location</TableHead>
            <TableHead className="w-[100px] text-right pr-4 hidden md:table-cell">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consolidatedEntries.map((entry) => {
            const entryId = entry._id || entry.date + entry.timeIn
            const isExpanded = expandedRows.has(entryId)
            const dayEntries = getEntriesForDate(entry.date)
            
            return (
              <Fragment key={entryId}>
                <TableRow className="md:cursor-pointer md:hover:bg-muted/50" onClick={() => window.innerWidth >= 768 && toggleRow(entryId)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="hidden md:inline">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                      <span suppressHydrationWarning>{formatDateUtil(entry.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatTime(entry.timeIn)}</TableCell>
                  <TableCell className="text-sm">{entry.timeOut ? formatTime(entry.timeOut) : "-"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm truncate">{entry.location || 'Location Unavailable'}</TableCell>
                  <TableCell className="text-right font-mono text-sm pr-4 hidden md:table-cell">{formatDuration(entry.duration)}</TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="hidden md:table-row">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-4 bg-muted/20">
                        <DayTimeline entries={dayEntries.map(e => ({...e, id: e._id || entry.date + e.timeIn, date: entry.date}))} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
