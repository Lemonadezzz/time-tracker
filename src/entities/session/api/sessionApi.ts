/**
 * Session Entity - API Client
 * Handles all session-related API calls
 */

import { apiClient } from '@/shared/lib/api/apiClient'
import { API_ENDPOINTS } from '@/shared/config/constants'
import { SessionResponse, SessionAction, SessionActionResponse } from '../model/types'

export const sessionApi = {
  /**
   * Get active session status
   */
  async getActiveSession(): Promise<SessionResponse> {
    return apiClient.get<SessionResponse>(API_ENDPOINTS.SESSION, {
      headers: {
        'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })
  },

  /**
   * Start a new session
   */
  async startSession(location: string): Promise<SessionActionResponse> {
    return apiClient.post<SessionActionResponse>(API_ENDPOINTS.SESSION, {
      action: 'start',
      location
    }, {
      headers: {
        'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })
  },

  /**
   * Stop active session
   */
  async stopSession(location: string): Promise<SessionActionResponse> {
    return apiClient.post<SessionActionResponse>(API_ENDPOINTS.SESSION, {
      action: 'stop',
      location
    }, {
      headers: {
        'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })
  },

  /**
   * Start a break
   */
  async startBreak(): Promise<SessionActionResponse> {
    return apiClient.post<SessionActionResponse>(API_ENDPOINTS.SESSION, {
      action: 'break'
    })
  },

  /**
   * Resume from break
   */
  async resumeFromBreak(): Promise<SessionActionResponse> {
    return apiClient.post<SessionActionResponse>(API_ENDPOINTS.SESSION, {
      action: 'resume'
    })
  }
}
