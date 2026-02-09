export interface User {
  _id?: string
  username: string
  password: string
  email?: string
  role: 'admin' | 'user' | 'developer'
  departmentId?: string
  googleId?: string
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserSession {
  username: string
  role: 'admin' | 'user' | 'developer'
  isLoggedIn: boolean
}