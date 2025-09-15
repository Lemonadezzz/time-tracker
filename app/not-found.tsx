import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        {/* Dead Head Cartoon */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Head */}
            <div className="w-32 h-32 bg-yellow-200 rounded-full border-4 border-gray-800 relative">
              {/* X Eyes */}
              <div className="absolute top-8 left-6 text-4xl font-bold text-red-600 rotate-12">×</div>
              <div className="absolute top-8 right-6 text-4xl font-bold text-red-600 -rotate-12">×</div>
              {/* Mouth */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-4 border-4 border-gray-800 rounded-full border-t-0"></div>
              {/* Tongue */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-6 bg-pink-400 rounded-b-full"></div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-muted-foreground">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Oops! The page you're looking for has gone to the digital graveyard.
          </p>
        </div>

        <Button asChild>
          <Link href="/" className="gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}