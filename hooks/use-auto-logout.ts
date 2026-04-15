"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { authService } from '@/lib/auth'
import { toast } from 'sonner'

export function useAutoLogout() {
  const router = useRouter()
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const warningShownRef = useRef(false)
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [shouldLogout, setShouldLogout] = useState<{ reason: 'expired' | 'warning_ignored' } | null>(null)
  const [shouldShowWarning, setShouldShowWarning] = useState(false)

  // Handle logout in useEffect to avoid render issues
  useEffect(() => {
    if (shouldLogout) {
      performLogout(shouldLogout.reason)
      setShouldLogout(null)
    }
  }, [shouldLogout])

  // Handle warning in useEffect to avoid render issues
  useEffect(() => {
    if (shouldShowWarning) {
      displayWarning()
      setShouldShowWarning(false)
    }
  }, [shouldShowWarning])

  const performLogout = async (reason: 'expired' | 'warning_ignored') => {
    // Clear all intervals and timeouts
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current)
    }

    // DO NOT stop timer sessions - only clear auth data for UI access
    // Timer continues running in the background
    
    // Clear auth data
    authService.removeToken()
    localStorage.removeItem('loggedInUsername')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userAvatar')
    
    // Sign out and redirect
    await signOut({ redirect: false })
    
    const message = reason === 'warning_ignored' 
      ? 'Session expired due to inactivity - timer continues running' 
      : 'Session expired after 1 hour of inactivity - timer continues running'
    
    toast.info('Logged out', {
      description: message,
      duration: 5000
    })
    
    router.push('/')
  }

  const displayWarning = () => {
    if (warningShownRef.current) return
    
    warningShownRef.current = true
    
    toast.info('Session expiring soon', {
      description: 'You will be logged out in 15 minutes due to inactivity. Timer will continue running. Click anywhere to stay logged in.',
      duration: 900000, // 15 minutes
      action: {
        label: 'Stay logged in',
        onClick: () => {
          authService.updateLastActivity()
          warningShownRef.current = false
          if (logoutTimeoutRef.current) {
            clearTimeout(logoutTimeoutRef.current)
          }
        }
      }
    })

    // Set timeout to logout after 15 more minutes if no activity
    logoutTimeoutRef.current = setTimeout(() => {
      setShouldLogout({ reason: 'warning_ignored' })
    }, 15 * 60 * 1000) // 15 minutes
  }

  const checkSession = () => {
    if (authService.isSessionExpired()) {
      const lastActivity = authService.getLastActivity()
      const now = Date.now()
      const timeSinceActivity = now - lastActivity
      const fortyFiveMinutes = 45 * 60 * 1000 // 45 minutes

      if (timeSinceActivity >= fortyFiveMinutes && !warningShownRef.current) {
        // Show warning at 45 minutes (15 minutes before logout)
        setShouldShowWarning(true)
      } else if (timeSinceActivity >= 60 * 60 * 1000) {
        // Force logout at 60 minutes
        setShouldLogout({ reason: 'expired' })
      }
    } else {
      // Reset warning if user became active again
      warningShownRef.current = false
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current)
      }
    }
  }

  const updateActivity = () => {
    authService.updateLastActivity()
    warningShownRef.current = false
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current)
    }
  }

  useEffect(() => {
    // Update activity on mount
    updateActivity()

    // Check session every 30 seconds
    checkIntervalRef.current = setInterval(checkSession, 30 * 1000)

    // Activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      updateActivity()
    }

    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current)
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [])

  return { updateActivity }
}