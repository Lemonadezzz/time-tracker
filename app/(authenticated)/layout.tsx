"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import Sidebar from "../../components/sidebar"
import { authService } from "@/lib/auth"
import { isAdminOnlyPage, hasAdminAccess } from "@/lib/permissions"
import { useAutoLogout } from "@/hooks/use-auto-logout"
import { Toaster } from "sonner"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { updateActivity } = useAutoLogout()

  useEffect(() => {
    const savedUsername = localStorage.getItem("loggedInUsername")
    const userRole = localStorage.getItem("userRole") as 'admin' | 'user' | 'developer'
    
    // Check if session is expired
    if (authService.isSessionExpired()) {
      handleLogout()
      return
    }
    
    if (!savedUsername) {
      router.push("/")
    } else {
      setUsername(savedUsername)
      
      // Check if user has permission to access current page
      if (isAdminOnlyPage(pathname) && !hasAdminAccess(userRole)) {
        router.push("/timer")
      }
      
      // Update activity on page load
      updateActivity()
    }
  }, [router, pathname, updateActivity])

  const handleLogout = async () => {
    // Only stop timer session on MANUAL logout, not auto-logout
    try {
      const token = authService.getToken()
      const sessionId = authService.getSessionId()
      if (token) {
        await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId || ''
          },
          body: JSON.stringify({ action: 'stop', location: 'Manual logout' })
        })
      }
    } catch (error) {
      // Silent fail - logout is more important
    }

    authService.clearSession() // Full cleanup on manual logout
    localStorage.removeItem("loggedInUsername")
    localStorage.removeItem("userRole")
    await signOut({ redirect: false })
    router.push("/")
  }

  if (!username) return null

  return (
    <>
      <div className="flex min-h-screen" suppressHydrationWarning>
        <Sidebar username={username} onLogout={handleLogout} />
        <div className="main-content flex-1 flex flex-col items-center">
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
      <Toaster richColors position="bottom-right" />
    </>
  )
}