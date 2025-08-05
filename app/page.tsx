"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "../src/components/features/login-form"
import { authService } from "@/lib/auth"

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = authService.getToken()
    const savedUsername = localStorage.getItem("loggedInUsername")
    if (token && savedUsername) {
      setIsLoggedIn(true)
      setUsername(savedUsername)
      router.push("/timer")
    }
  }, [router])

  const handleLogin = (user: string) => {
    localStorage.setItem("loggedInUsername", user)
    setIsLoggedIn(true)
    setUsername(user)
    router.push("/timer")
  }

  return (
    <div className="min-h-screen bg-background">
      <LoginForm onLogin={handleLogin} />
    </div>
  )
}
