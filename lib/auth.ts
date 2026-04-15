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
  },

  clearSession() {
    // Full session cleanup
    localStorage.removeItem('authToken')
    localStorage.removeItem('lastActivity')
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
    const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
    return (now - lastActivity) > oneHour
  }
}