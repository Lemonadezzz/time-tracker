"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { authService } from '@/lib/auth'
import { toast } from 'sonner'

export function useAutoLogout() {
  const router = useRouter()
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const warningShownRef = useRef(false)
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogout = async (reason: 'expired' | 'warning_ignored' = 'expired') => {
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
    // Keep sessionId for timer continuity
    
    // Sign out and redirect
    await signOut({ redirect: false })
    
    const message = reason === 'warning_ignored' 
      ? 'Session expired due to inactivity - timer continues running' 
      : 'Session expired after 15 minutes of inactivity - timer continues running'
    
    toast.info('Logged out', {
      description: message,
      duration: 5000
    })
    
    router.push('/')
  }

  const showWarning = () => {
    if (warningShownRef.current) return
    
    warningShownRef.current = true
    
    toast.info('Session expiring soon', {
      description: 'You will be logged out in 2 minutes due to inactivity. Timer will continue running. Click anywhere to stay logged in.',
      duration: 120000, // 2 minutes
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

    // Set timeout to logout after 2 more minutes if no activity
    logoutTimeoutRef.current = setTimeout(() => {
      handleLogout('warning_ignored')
    }, 2 * 60 * 1000) // 2 minutes
  }

  const checkSession = () => {
    if (authService.isSessionExpired()) {
      const lastActivity = authService.getLastActivity()
      const now = Date.now()
      const timeSinceActivity = now - lastActivity
      const thirteenMinutes = 13 * 60 * 1000 // 13 minutes

      if (timeSinceActivity >= thirteenMinutes && !warningShownRef.current) {
        // Show warning at 13 minutes
        showWarning()
      } else if (timeSinceActivity >= 15 * 60 * 1000) {
        // Force logout at 15 minutes
        handleLogout()
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
    // Generate session ID if not exists
    if (!authService.getSessionId()) {
      authService.generateSessionId()
    }

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