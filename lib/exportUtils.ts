import * as XLSX from 'xlsx'

interface TimeEntry {
  username?: string
  date: string
  timeIn: string
  timeOut: string | null
  duration: number
}

export const exportTimeEntriesToExcel = (
  entries: TimeEntry[], 
  filename: string, 
  includeUser: boolean = false
) => {
  const exportData = entries.map(entry => {
    const hours = Math.floor(entry.duration / 3600)
    const minutes = Math.floor((entry.duration % 3600) / 60)
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    
    const baseData = {
      Date: entry.date,
      'Time In': entry.timeIn,
      'Time Out': entry.timeOut || '-',
      Location: entry.location || 'Location Unavailable',
      Duration: durationText
    }

    if (includeUser && entry.username) {
      return {
        User: entry.username,
        ...baseData
      }
    }

    return baseData
  })
  
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, includeUser ? 'Team Reports' : 'Time Entries')
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`)
}