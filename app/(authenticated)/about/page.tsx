"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Timer, Users, BarChart3, Settings, Shield, MapPin, Download, Bell, Clock, Calendar, Activity, Lock, Database, Smartphone } from "lucide-react"

export default function AboutPage() {
  const features = [
    {
      category: "Time Tracking",
      icon: Timer,
      items: [
        "Real-time timer with start/stop functionality",
        "Automatic location detection and weather integration",
        "Session management with overlap detection",
        "Manual time entry editing and validation",
        "Duration calculation and formatting"
      ]
    },
    {
      category: "User Management",
      icon: Users,
      items: [
        "Role-based access control (Admin, Developer, User)",
        "User creation and profile management",
        "Password update functionality",
        "Cascade delete for data integrity",
        "JWT-based authentication system"
      ]
    },
    {
      category: "Reporting & Analytics",
      icon: BarChart3,
      items: [
        "Personal timesheet reports with filtering",
        "Team reports and analytics dashboard",
        "CSV export functionality with progress indicators",
        "Date range filtering and pagination",
        "Real-time data visualization"
      ]
    },
    {
      category: "System Features",
      icon: Settings,
      items: [
        "Customizable time format (12/24 hour)",
        "Multiple date format options (US/EU/ISO)",
        "Dark/Light theme toggle",
        "System activity logging and monitoring",
        "Responsive design for all devices"
      ]
    },
    {
      category: "Security & Privacy",
      icon: Shield,
      items: [
        "Secure JWT token authentication",
        "Role-based permission system",
        "Data encryption and protection",
        "Session management and timeout",
        "Audit trail for all user actions"
      ]
    },
    {
      category: "Integration & Export",
      icon: Download,
      items: [
        "CSV export with custom formatting",
        "Location services integration",
        "Weather API integration",
        "Real-time notifications with Sonner",
        "Progress indicators for user feedback"
      ]
    }
  ]

  const techStack = [
    { name: "Next.js 15", type: "Framework" },
    { name: "TypeScript", type: "Language" },
    { name: "MongoDB", type: "Database" },
    { name: "Tailwind CSS", type: "Styling" },
    { name: "Radix UI", type: "Components" },
    { name: "JWT", type: "Authentication" },
    { name: "Sonner", type: "Notifications" },
    { name: "Lucide Icons", type: "Icons" }
  ]

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Info className="w-6 h-6" />
          <h1 className="text-2xl font-bold">About TimeSurgeon</h1>
        </div>

        {/* Application Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Application Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              TimeSurgeon is a comprehensive time tracking application built with Next.js 15 and MongoDB. 
              It provides real-time time tracking, location services, weather integration, and robust reporting 
              capabilities with role-based access control. The application features a modern, responsive design 
              with dark/light theme support and customizable user preferences.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.category}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="w-5 h-5" />
                    {feature.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {techStack.map((tech) => (
                <div key={tech.name} className="flex flex-col items-center p-3 border rounded-lg">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {tech.type}
                  </Badge>
                  <span className="text-sm font-medium text-center">{tech.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Highlights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Key Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <MapPin className="w-8 h-8 text-blue-500" />
                <div>
                  <h4 className="font-medium">Location Services</h4>
                  <p className="text-sm text-muted-foreground">Automatic location detection with weather integration</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Bell className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="font-medium">Real-time Notifications</h4>
                  <p className="text-sm text-muted-foreground">Toast notifications with animated progress bars</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Lock className="w-8 h-8 text-red-500" />
                <div>
                  <h4 className="font-medium">Secure & Scalable</h4>
                  <p className="text-sm text-muted-foreground">JWT authentication with role-based permissions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}