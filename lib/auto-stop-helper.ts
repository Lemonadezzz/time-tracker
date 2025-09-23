import { getDatabase } from '@/lib/mongodb'

export async function checkAndStopExpiredSessions() {
  try {
    const db = await getDatabase()
    const sessions = db.collection('sessions')
    const timeEntries = db.collection('timeentries')
    const logs = db.collection('system_logs')
    const users = db.collection('users')

    const now = new Date()
    const activeSessions = await sessions.find({ isActive: true }).toArray()
    let stoppedCount = 0

    for (const session of activeSessions) {
      const sessionStart = new Date(session.startTime)
      const sessionDate = new Date(sessionStart.getFullYear(), sessionStart.getMonth(), sessionStart.getDate())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // Stop if session is from previous day OR if today and past 10pm
      const shouldStop = sessionDate < today || 
        (sessionDate.getTime() === today.getTime() && now.getHours() >= 22)
      
      if (shouldStop) {
        const sessionEndTime = new Date(sessionStart)
        sessionEndTime.setHours(22, 0, 0, 0)
        const duration = Math.floor((sessionEndTime.getTime() - sessionStart.getTime()) / 1000)
        
        const user = await users.findOne({ _id: session.userId })
        
        await timeEntries.insertOne({
          userId: session.userId.toString(),
          date: sessionStart.toLocaleDateString("en-CA"),
          timeIn: sessionStart.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          }),
          timeOut: "10:00 PM",
          duration: Math.max(duration, 0),
          location: session.location || 'Location Unavailable',
          createdAt: now,
          updatedAt: now
        })

        await sessions.updateOne(
          { _id: session._id },
          { $set: { isActive: false, endTime: sessionEndTime } }
        )

        await logs.insertOne({
          action: 'timer_auto_stop',
          details: `Timer automatically stopped at 10:00 PM`,
          username: user?.username || 'Unknown',
          timestamp: now,
          ip: 'auto'
        })

        stoppedCount++
      }
    }

    return stoppedCount
  } catch (error) {
    console.error('Auto-stop helper error:', error)
    return 0
  }
}