export const authService = {
  async login(username: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const result = await response.json()
    if (result.token) {
      this.updateLastActivity()
    }
    return result
  },

  getToken() {
    return localStorage.getItem('authToken')
  },

  setToken(token: string) {
    localStorage.setItem('authToken', token)
    this.updateLastActivity()
  },

  removeToken() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('lastActivity')
    // Keep sessionId for timer continuity - only remove on manual logout
  },

  clearSession() {
    // Only call this on manual logout to fully clear session
    localStorage.removeItem('authToken')
    localStorage.removeItem('lastActivity')
    localStorage.removeItem('sessionId')
  },

  updateLastActivity() {
    localStorage.setItem('lastActivity', Date.now().toString())
  },

  getLastActivity(): number {
    const lastActivity = localStorage.getItem('lastActivity')
    return lastActivity ? parseInt(lastActivity) : 0
  },

  isSessionExpired(): boolean {
    const lastActivity = this.getLastActivity()
    if (!lastActivity) return true
    
    const now = Date.now()
    const fifteenMinutes = 15 * 60 * 1000 // 15 minutes in milliseconds
    return (now - lastActivity) > fifteenMinutes
  },

  generateSessionId(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('sessionId', sessionId)
    return sessionId
  },

  getSessionId(): string | null {
    return localStorage.getItem('sessionId')
  }
}