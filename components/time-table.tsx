"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Clock, ChevronDown, ChevronRight } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import DayTimeline from "@/src/components/features/day-timeline"

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

  const getEntriesForDate = (date: string) => {
    return entries.filter(entry => entry.date === date)
  }

  // Merge fragmented entries by date
  const mergedEntries = entries.reduce((acc, entry) => {
    const key = entry.date
    
    if (!acc[key]) {
      acc[key] = {
        ...entry,
        timeIns: [entry.timeIn],
        timeOuts: entry.timeOut ? [entry.timeOut] : [],
        totalDuration: entry.duration
      }
    } else {
      acc[key].timeIns.push(entry.timeIn)
      if (entry.timeOut) acc[key].timeOuts.push(entry.timeOut)
      acc[key].totalDuration += entry.duration
    }
    
    return acc
  }, {} as Record<string, any>)

  // Convert to array and calculate earliest/latest times
  const consolidatedEntries = Object.values(mergedEntries).map((entry: any) => {
    const timeIns = entry.timeIns.sort()
    const timeOuts = entry.timeOuts.sort()
    
    return {
      _id: entry._id,
      date: entry.date,
      timeIn: timeIns[0], // Earliest time in
      timeOut: timeOuts.length > 0 ? timeOuts[timeOuts.length - 1] : null, // Latest time out
      duration: entry.totalDuration
    }
  })

  if (!mounted) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry._id || entry.date + entry.timeIn}>
                <TableCell className="font-medium">{formatDate(entry.date)}</TableCell>
                <TableCell>{entry.timeIn}</TableCell>
                <TableCell>{entry.timeOut || "-"}</TableCell>
                <TableCell className="text-right font-mono">{formatDuration(entry.duration)}</TableCell>
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
        <p>No time entries for this period</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time In</TableHead>
            <TableHead>Time Out</TableHead>
            <TableHead className="text-right">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consolidatedEntries.map((entry) => {
            const entryId = entry._id || entry.date + entry.timeIn
            const isExpanded = expandedRows.has(entryId)
            const dayEntries = getEntriesForDate(entry.date)
            
            return (
              <>
                <TableRow key={entryId} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(entryId)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      {formatDate(entry.date)}
                    </div>
                  </TableCell>
                  <TableCell>{entry.timeIn}</TableCell>
                  <TableCell>{entry.timeOut || "-"}</TableCell>
                  <TableCell className="text-right font-mono">{formatDuration(entry.duration)}</TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <div className="p-4 bg-muted/20">
                        <DayTimeline entries={dayEntries.map(e => ({...e, id: e._id || e.date + e.timeIn}))} />
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
