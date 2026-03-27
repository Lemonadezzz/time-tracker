/**
 * Feature: Resume Work - UI Component
 */

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useResumeWork } from '../model/useResumeWork'

export const ResumeWorkButton = () => {
  const { resumeWork, canResume, isLoading } = useResumeWork()

  if (!canResume) return null

  return (
    <Button
      onClick={resumeWork}
      variant="outline"
      size="sm"
      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
      disabled={isLoading}
    >
      <Play className="w-4 h-4 mr-2" />
      Resume Work
    </Button>
  )
}
