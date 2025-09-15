import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const dateFormat = typeof window !== 'undefined' ? localStorage.getItem('dateFormat') || 'US' : 'US'
  
  switch (dateFormat) {
    case 'EU':
      return date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    case 'ISO':
      const weekday = date.toLocaleDateString("en-US", { weekday: "short" })
      const isoDate = date.toISOString().split('T')[0]
      return `${weekday}, ${isoDate}`
    default: // US
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
  }
}
