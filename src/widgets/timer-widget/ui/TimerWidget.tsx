/**
 * Timer Widget - Main UI Component
 * Composes all timer-related features
 */

"use client"

import { useState, useEffect } from 'react'

import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { StartTimerButton } from "@/features/start-timer"
import { StopTimerButton } from "@/features/stop-timer"
import { TakeBreakButton } from "@/features/take-break"
import { ResumeWorkButton } from "@/features/resume-work"
import { useTimerWidget } from '../model/useTimerWidget'
import { formatTimerDisplay } from "@/shared/lib/time"

interface TimerWidgetProps {
  location: string
  onSessionEnd?: () => void
}

export const TimerWidget = ({ location, onSessionEnd }: TimerWidgetProps) => {
  const { isTracking, isOnBreak, sessionStart, currentSessionTime } = useTimerWidget()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="text-center">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-6 md:space-y-0">
          {/* Left Side: Current Time & Date */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="text-2xl font-mono font-bold text-primary">
              {currentTime.toLocaleTimeString("en-US", {
                hour12: true,
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            {isTracking && sessionStart ? (
              <div className="text-sm md:text-lg text-muted-foreground">
                {isOnBreak ? (
                  <>
                    Break started at{" "}
                    <span className="font-semibold text-blue-600">
                      {sessionStart.toLocaleTimeString("en-US", {
                        hour12: true,
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    Started at{" "}
                    <span className="font-semibold text-primary">
                      {sessionStart.toLocaleTimeString("en-US", {
                        hour12: true,
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="text-sm md:text-lg text-muted-foreground">
                Ready to start tracking
              </div>
            )}
          </div>

          {/* Right Side: Timer Display and Controls */}
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Timer Display */}
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-mono font-bold text-primary">
                {formatTimerDisplay(currentSessionTime)}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">
                {isTracking ? (isOnBreak ? "On Break" : "Elapsed Time") : "Session Time"}
              </div>

              {/* Break Controls */}
              {isTracking && (
                <div className="mt-3">
                  {!isOnBreak ? <TakeBreakButton /> : <ResumeWorkButton />}
                </div>
              )}
            </div>

            {/* Start/Stop Button */}
            <div className="flex justify-center">
              {!isTracking ? (
                <StartTimerButton location={location} />
              ) : (
                <StopTimerButton location={location} onSuccess={onSessionEnd} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
