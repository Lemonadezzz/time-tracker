"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import Sidebar from "../../components/sidebar"
import { authService } from "@/lib/auth"
import { isAdminOnlyPage, hasAdminAccess } from "@/lib/permissions"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const savedUsername = localStorage.getItem("loggedInUsername")
    const userRole = localStorage.getItem("userRole") as 'admin' | 'user' | 'developer'
    
    if (!savedUsername) {
      router.push("/")
    } else {
      setUsername(savedUsername)
      
      // Check if user has permission to access current page
      if (isAdminOnlyPage(pathname) && !hasAdminAccess(userRole)) {
        router.push("/timer")
      }
    }
  }, [router, pathname])

  const handleLogout = async () => {
    authService.removeToken()
    localStorage.removeItem("loggedInUsername")
    localStorage.removeItem("userRole")
    await signOut({ redirect: false })
    router.push("/")
  }

  if (!username) return null

  return (
    <div className="flex min-h-screen" suppressHydrationWarning>
      <Sidebar username={username} onLogout={handleLogout} />
      <div className="flex-1 pt-16 md:pt-0" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>{children}</div>
    </div>
  )
}