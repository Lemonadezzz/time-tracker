export const authService = {
  async login(username: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    return response.json()
  },

  async register(username: string, password: string) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    return response.json()
  },

  getToken() {
    return localStorage.getItem('authToken')
  },

  setToken(token: string) {
    localStorage.setItem('authToken', token)
  },

  removeToken() {
    localStorage.removeItem('authToken')
  }
}