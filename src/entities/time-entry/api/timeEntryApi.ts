/**
 * TimeEntry Entity - API Client
 */

import { apiClient } from '@/shared/lib/api/apiClient'
import { API_ENDPOINTS } from '@/shared/config/constants'
import { Pagination } from '@/shared/types/common'
import { TimeEntry, CreateTimeEntryDto } from '../model/types'

interface GetEntriesParams {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  sort?: 'latest' | 'oldest'
}

interface GetEntriesResponse {
  entries: TimeEntry[]
  pagination: Pagination
}

export const timeEntryApi = {
  /**
   * Get time entries with pagination
   */
  async getEntries(params: GetEntriesParams = {}): Promise<GetEntriesResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)
    if (params.sort) searchParams.set('sort', params.sort)
    
    return apiClient.get<GetEntriesResponse>(
      `${API_ENDPOINTS.TIME_ENTRIES}?${searchParams}`
    )
  },

  /**
   * Create a new time entry
   */
  async createEntry(entry: CreateTimeEntryDto): Promise<{ success: boolean; entry: TimeEntry }> {
    return apiClient.post(`${API_ENDPOINTS.TIME_ENTRIES}`, entry)
  }
}
