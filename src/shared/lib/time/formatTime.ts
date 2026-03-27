/**
 * Time formatting utilities
 * Pure functions with no dependencies
 */

export const formatTimerDisplay = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export const formatTime12Hour = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const formatTime24Hour = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const convertTimeFormat = (timeStr: string, to24Hour: boolean): string => {
  if (!timeStr) return timeStr
  
  if (to24Hour) {
    // Convert to 24-hour format
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [hourMin, ampm] = timeStr.split(' ')
      let [hour, minute] = hourMin.split(':').map(Number)
      if (ampm === 'PM' && hour !== 12) hour += 12
      if (ampm === 'AM' && hour === 12) hour = 0
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }
    return timeStr
  } else {
    // Convert to 12-hour format
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
    const [hour, minute] = timeStr.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${hour12}:${minute} ${ampm}`
  }
}
