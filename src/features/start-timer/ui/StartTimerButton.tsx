/**
 * Feature: Start Timer - UI Component
 */

import { Button } from "@/components/ui/button"
import { useStartTimer } from '../model/useStartTimer'

interface StartTimerButtonProps {
  location: string
  disabled?: boolean
}

export const StartTimerButton = ({ location, disabled }: StartTimerButtonProps) => {
  const { startTimer, isLoading, canStart } = useStartTimer({ location })

  return (
    <div className="relative">
      <Button
        onClick={startTimer}
        size="lg"
        className="gap-2 rounded-full w-20 h-20 md:w-24 md:h-24 p-0 cursor-pointer relative overflow-hidden"
        disabled={disabled || isLoading || !canStart}
      >
        <span className="text-4xl md:text-5xl font-bold relative z-10">▶</span>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-400/50 rounded-full animate-pulse" />
        )}
      </Button>
    </div>
  )
}
