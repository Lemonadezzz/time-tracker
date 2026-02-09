"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import LoginForm from "@/components/login-form"
import { authService } from "@/lib/auth"

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Handle Google OAuth session
    if (status === "authenticated" && session?.accessToken) {
      authService.setToken(session.accessToken as string)
      localStorage.setItem("loggedInUsername", session.user?.name || session.user?.email || "User")
      localStorage.setItem("userRole", session.user?.role || "user")
      router.push("/timer")
      return
    }

    // Handle traditional login
    const token = authService.getToken()
    const savedUsername = localStorage.getItem("loggedInUsername")
    if (token && savedUsername) {
      setIsLoggedIn(true)
      setUsername(savedUsername)
      router.push("/timer")
    }
  }, [router, session, status])

  const handleLogin = (user: string) => {
    localStorage.setItem("loggedInUsername", user)
    setIsLoggedIn(true)
    setUsername(user)
    router.push("/timer")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <LoginForm onLogin={handleLogin} />
    </div>
  )
}
