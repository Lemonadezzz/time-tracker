"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, ChevronDown, ChevronRight } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import DayTimeline from "@/components/day-timeline"

interface TeamTimeEntry {
  _id?: string
  username: string
  date: string
  timeIn: string
  timeOut: string | null
  duration: number
}

interface TeamTimeTableProps {
  entries: TeamTimeEntry[]
}

export default function TeamTimeTable({ entries }: TeamTimeTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
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

  const getEntriesForUserAndDate = (username: string, date: string) => {
    return entries.filter(entry => entry.username === username && entry.date === date)
  }

  // Filter entries within valid time range (6 AM - 10 PM)
  const isValidTime = (timeStr: string) => {
    const [hourMin, ampm] = timeStr.split(' ')
    let [hour, minute] = hourMin.split(':').map(Number)
    if (ampm === 'PM' && hour !== 12) hour += 12
    if (ampm === 'AM' && hour === 12) hour = 0
    const totalMinutes = hour * 60 + minute
    return totalMinutes >= 360 && totalMinutes <= 1320 // 6 AM (360) to 10 PM (1320)
  }

  const validEntries = entries.filter(entry => {
    // Only include entries with valid time in and time out within range
    const validTimeIn = isValidTime(entry.timeIn)
    const validTimeOut = entry.timeOut ? isValidTime(entry.timeOut) : false
    // Forfeit sessions without proper time out or outside valid hours
    return validTimeIn && validTimeOut
  })

  // Merge fragmented entries by user and date
  const mergedEntries = validEntries.reduce((acc, entry) => {
    const key = `${entry.username}-${entry.date}`
    
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

  // Convert to array and calculate earliest/latest times
  const consolidatedEntries = Object.values(mergedEntries).map((entry: any) => {
    // Parse time strings to compare properly
    const parseTimeForSort = (timeStr: string) => {
      const [hourMin, ampm] = timeStr.split(' ')
      let [hour, minute] = hourMin.split(':').map(Number)
      if (ampm === 'PM' && hour !== 12) hour += 12
      if (ampm === 'AM' && hour === 12) hour = 0
      return hour * 60 + minute // Convert to minutes for sorting
    }
    
    // Sort time ins and time outs properly
    const sortedTimeIns = entry.timeIns.sort((a: string, b: string) => 
      parseTimeForSort(a) - parseTimeForSort(b)
    )
    const sortedTimeOuts = entry.timeOuts.sort((a: string, b: string) => 
      parseTimeForSort(a) - parseTimeForSort(b)
    )
    
    const earliestTimeIn = sortedTimeIns[0]
    const latestTimeOut = sortedTimeOuts.length > 0 ? sortedTimeOuts[sortedTimeOuts.length - 1] : null
    
    // Calculate actual duration between earliest and latest times
    let actualDuration = 0
    if (earliestTimeIn && latestTimeOut) {
      const startMinutes = parseTimeForSort(earliestTimeIn)
      const endMinutes = parseTimeForSort(latestTimeOut)
      actualDuration = (endMinutes - startMinutes) * 60 // Convert to seconds
    }
    
    return {
      _id: entry._id,
      username: entry.username,
      date: entry.date,
      timeIn: earliestTimeIn,
      timeOut: latestTimeOut,
      duration: actualDuration
    }
  })

  if (!mounted) {
    return (
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">Time In</TableHead>
              <TableHead className="hidden md:table-cell">Time Out</TableHead>
              <TableHead className="text-right md:hidden">Duration</TableHead>
              <TableHead className="text-right hidden md:table-cell">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="min-w-[100px]">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="min-w-[100px] hidden md:table-cell">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="min-w-[100px] hidden md:table-cell">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="text-right min-w-[80px] md:hidden">
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell className="text-right min-w-[80px] hidden md:table-cell">
                  <Skeleton className="h-4 w-12" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (consolidatedEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No team time entries for this period</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="hidden md:table-cell">Time In</TableHead>
            <TableHead className="hidden md:table-cell">Time Out</TableHead>
            <TableHead className="text-right md:hidden">Duration</TableHead>
            <TableHead className="text-right hidden md:table-cell">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consolidatedEntries.map((entry) => {
            const entryId = entry._id || `${entry.username}-${entry.date}-${entry.timeIn}`
            const isExpanded = expandedRows.has(entryId)
            const userDayEntries = getEntriesForUserAndDate(entry.username, entry.date)
            
            return (
              <>
                <TableRow key={entryId} className="md:cursor-pointer md:hover:bg-muted/50" onClick={() => window.innerWidth >= 768 && toggleRow(entryId)}>
                  <TableCell className="font-medium min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <span className="hidden md:inline">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                      {entry.username}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[120px]">{formatDate(entry.date)}</TableCell>
                  <TableCell className="min-w-[100px] hidden md:table-cell">{entry.timeIn}</TableCell>
                  <TableCell className="min-w-[100px] hidden md:table-cell">{entry.timeOut || "-"}</TableCell>
                  <TableCell className="text-right font-mono min-w-[80px] md:hidden">{formatDuration(entry.duration)}</TableCell>
                  <TableCell className="text-right font-mono min-w-[80px] hidden md:table-cell">{formatDuration(entry.duration)}</TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="hidden md:table-row">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-4 bg-muted/20">
                        <DayTimeline entries={userDayEntries.map(e => ({...e, id: e._id || `${e.username}-${e.date}-${e.timeIn}`, date: e.date}))} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}