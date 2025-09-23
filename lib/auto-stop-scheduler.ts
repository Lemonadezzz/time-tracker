let intervalId: NodeJS.Timeout | null = null

export function startAutoStopScheduler() {
  if (intervalId) return // Already running
  
  // Run every 5 minutes
  intervalId = setInterval(async () => {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/auto-stop`)
      const result = await response.json()
      if (result.stoppedSessions > 0) {
        console.log(`Auto-stopped ${result.stoppedSessions} sessions at ${result.timestamp}`)
      }
    } catch (error) {
      console.error('Auto-stop scheduler error:', error)
    }
  }, 5 * 60 * 1000) // 5 minutes
  
  console.log('Auto-stop scheduler started')
}

export function stopAutoStopScheduler() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('Auto-stop scheduler stopped')
  }
}