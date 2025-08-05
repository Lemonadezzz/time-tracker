"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, User, ChevronLeft, ChevronRight, Timer, FileText, BarChart3, Settings, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  username: string
  onLogout: () => void
}

const allNavigation = [
  { name: "Timer", href: "/timer", icon: Timer, roles: ['admin', 'user', 'developer'] },
  { name: "Time Reports", href: "/logs", icon: FileText, roles: ['admin', 'user', 'developer'] },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ['admin', 'developer'] },
  { name: "Team", href: "/team", icon: Users, roles: ['admin', 'developer'] },
  { name: "Team Reports", href: "/team-reports", icon: TrendingUp, roles: ['admin', 'developer'] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ['admin', 'user', 'developer'] },
]

export default function Sidebar({ username, onLogout }: SidebarProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'user' | 'developer'>('user')
  const [roleLoaded, setRoleLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const checkRole = () => {
      const role = localStorage.getItem('userRole') as 'admin' | 'user' | 'developer'
      if (role) {
        setUserRole(role)
        setRoleLoaded(true)
      } else {
        setRoleLoaded(true) // Set loaded even if no role found
      }
    }
    checkRole()
  }, [])

  const navigation = allNavigation.filter(item => item.roles.includes(userRole))

  useEffect(() => {
    const savedSidebarState = localStorage.getItem("sidebarCollapsed")
    if (savedSidebarState) {
      setSidebarCollapsed(JSON.parse(savedSidebarState))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div
      className={`${
        sidebarCollapsed ? "w-16" : "w-64"
      } bg-card border-r flex flex-col transition-all duration-300 ease-in-out relative`}
    >
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-6 z-10 w-6 h-6 p-0 rounded-full border bg-background shadow-md hover:bg-accent"
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </Button>

      <div className="p-4 border-b">
        {!sidebarCollapsed && (
          <h1 className="text-sm font-semibold text-muted-foreground">TimeSurgeon</h1>
        )}
      </div>

      <div className="flex-1 p-4 pt-6">
        <nav className="space-y-2">
          {mounted && roleLoaded && navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    sidebarCollapsed && "px-2",
                    isActive && "bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t space-y-3">
        {sidebarCollapsed ? (
          <>
            <div className="flex justify-center" title={username}>
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <Button onClick={onLogout} variant="outline" size="sm" className="w-full p-2 bg-transparent" title="Logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="truncate">{username}</span>
            </div>
            <Button onClick={onLogout} variant="outline" size="sm" className="w-full gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
