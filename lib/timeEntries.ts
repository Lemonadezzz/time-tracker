import { TimeEntry } from './models/TimeEntry'

export const timeEntriesService = {
  async getEntries(): Promise<TimeEntry[]> {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/time-entries', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    return data.entries || []
  },

  async createEntry(entry: Omit<TimeEntry, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entry)
    })
    return response.json()
  },

  async getAllEntries(): Promise<any[]> {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/team-time-entries', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    return data.entries || []
  }
}