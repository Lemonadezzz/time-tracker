/**
 * Feature: Stop Timer - UI Component
 */

import { Button } from "@/components/ui/button"
import { useStopTimer } from '../model/useStopTimer'

interface StopTimerButtonProps {
  location: string
  disabled?: boolean
  onSuccess?: () => void
}

export const StopTimerButton = ({ location, disabled, onSuccess }: StopTimerButtonProps) => {
  const { stopTimer, isLoading } = useStopTimer({ location, onSuccess })

  return (
    <div className="relative">
      <Button
        id="stop-tracking-btn"
        onClick={stopTimer}
        size="lg"
        className="gap-2 rounded-full w-20 h-20 md:w-24 md:h-24 p-0 cursor-pointer relative overflow-hidden bg-red-600 hover:bg-red-700 text-white"
        disabled={disabled || isLoading}
      >
        <span className="text-4xl md:text-5xl font-bold relative z-10">⏹</span>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-400/50 rounded-full animate-pulse" />
        )}
      </Button>
    </div>
  )
}
