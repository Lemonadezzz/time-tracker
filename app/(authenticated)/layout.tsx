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
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { updateActivity } = useAutoLogout()

  useEffect(() => {
    const savedUsername = localStorage.getItem("loggedInUsername")
    const savedAvatar = localStorage.getItem("userAvatar")
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
      setUserAvatar(savedAvatar)
      
      // Check if user has permission to access current page
      if (isAdminOnlyPage(pathname) && !hasAdminAccess(userRole)) {
        router.push("/timer")
      }
      
      // Update activity on page load
      updateActivity()
    }
  }, [router, pathname, updateActivity])

  const handleLogout = async () => {
    // Manual logout should NOT stop timer - only clear auth for UI access
    // Timer continues running in the background
    
    authService.clearSession()
    localStorage.removeItem("loggedInUsername")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userAvatar")
    await signOut({ redirect: false })
    router.push("/")
  }

  if (!username) return null

  return (
    <>
      <div className="flex min-h-screen" suppressHydrationWarning>
        <Sidebar username={username} onLogout={handleLogout} userAvatar={userAvatar} />
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