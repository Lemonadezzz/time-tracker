"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock } from "lucide-react"
import { formatDuration } from "@/lib/utils" // Import formatDuration from utils

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
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  if (entries.length === 0) {
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
