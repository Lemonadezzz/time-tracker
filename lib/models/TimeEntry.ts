export interface TimeEntry {
  _id?: string
  userId: string
  date: string
  timeIn: string
  timeOut: string | null
  duration: number
  location?: string
  createdAt: Date
  updatedAt: Date
}