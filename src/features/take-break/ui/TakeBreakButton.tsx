/**
 * Feature: Take Break - UI Component
 */

import { Button } from "@/components/ui/button"
import { Coffee } from "lucide-react"
import { useTakeBreak } from '../model/useTakeBreak'

export const TakeBreakButton = () => {
  const { takeBreak, canTakeBreak, isLoading } = useTakeBreak()

  return (
    <Button
      onClick={takeBreak}
      variant="outline"
      size="sm"
      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
      disabled={!canTakeBreak || isLoading}
    >
      <Coffee className="w-4 h-4 mr-2" />
      Take a Break
    </Button>
  )
}
