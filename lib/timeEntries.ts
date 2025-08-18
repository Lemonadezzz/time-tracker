import { TimeEntry } from './models/TimeEntry'

interface PaginationParams {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  sort?: 'latest' | 'oldest'
  user?: string
}

export const timeEntriesService = {
  async getEntries(params: PaginationParams = {}): Promise<{ entries: TimeEntry[], pagination: any }> {
    const token = localStorage.getItem('authToken')
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)
    if (params.sort) searchParams.set('sort', params.sort)
    
    const response = await fetch(`/api/time-entries?${searchParams}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    return { entries: data.entries || [], pagination: data.pagination }
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

  async getAllEntries(params: PaginationParams = {}): Promise<{ entries: any[], pagination: any }> {
    const token = localStorage.getItem('authToken')
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)
    if (params.sort) searchParams.set('sort', params.sort)
    if (params.user) searchParams.set('user', params.user)
    
    const response = await fetch(`/api/team-time-entries?${searchParams}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    return { entries: data.entries || [], pagination: data.pagination }
  }
}