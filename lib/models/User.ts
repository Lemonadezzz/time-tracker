export interface User {
  _id?: string
  username: string
  password: string
  role: 'admin' | 'user' | 'developer'
  createdAt: Date
  updatedAt: Date
}

export interface UserSession {
  username: string
  role: 'admin' | 'user' | 'developer'
  isLoggedIn: boolean
}