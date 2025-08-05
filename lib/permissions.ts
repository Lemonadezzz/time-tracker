export const checkPermission = (userRole: 'admin' | 'user' | 'developer', requiredRole: 'admin' | 'user' | 'developer'): boolean => {
  if (requiredRole === 'admin') {
    return userRole === 'admin' || userRole === 'developer'
  }
  return true // user role can access user-level pages
}

export const adminOnlyPages = ['/dashboard', '/team', '/team-reports']

export const isAdminOnlyPage = (pathname: string): boolean => {
  return adminOnlyPages.some(page => pathname.startsWith(page))
}

export const hasAdminAccess = (userRole: 'admin' | 'user' | 'developer'): boolean => {
  return userRole === 'admin' || userRole === 'developer'
}