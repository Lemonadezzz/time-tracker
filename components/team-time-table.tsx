"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock } from "lucide-react"
import { formatDuration } from "@/lib/utils"

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
        <p>No team time entries for this period</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time In</TableHead>
            <TableHead>Time Out</TableHead>
            <TableHead className="text-right">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry._id || `${entry.username}-${entry.date}-${entry.timeIn}`}>
              <TableCell className="font-medium">{entry.username}</TableCell>
              <TableCell>{formatDate(entry.date)}</TableCell>
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