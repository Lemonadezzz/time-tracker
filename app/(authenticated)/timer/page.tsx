"use client"

import TimeTrackerComponent from "@/components/time-tracker"
import { Toaster } from "sonner"

export default function TimerPage() {
  return (
    <>
      <TimeTrackerComponent />
      <Toaster richColors position="bottom-right" />
    </>
  )
}