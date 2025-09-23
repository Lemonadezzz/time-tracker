import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const sessions = db.collection('sessions')
    const timeEntries = db.collection('timeentries')
    const logs = db.collection('system_logs')
    const users = db.collection('users')

    // Find all active sessions
    const activeSessions = await sessions.find({ isActive: true }).toArray()
    
    const now = new Date()
    const stopTime = new Date()
    stopTime.setHours(22, 0, 0, 0) // 10:00 PM
    
    let stoppedCount = 0

    for (const session of activeSessions) {
      const sessionStart = new Date(session.startTime)
      const sessionDate = new Date(sessionStart.getFullYear(), sessionStart.getMonth(), sessionStart.getDate())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // Check if session should be auto-stopped (started before today OR started today before 10pm and it's now past 10pm)
      const shouldStop = sessionDate < today || 
        (sessionDate.getTime() === today.getTime() && now.getHours() >= 22 && sessionStart.getHours() < 22)
      
      if (shouldStop) {
        // Calculate duration until 10pm of the session start date
        const sessionEndTime = new Date(sessionStart)
        sessionEndTime.setHours(22, 0, 0, 0)
        const duration = Math.floor((sessionEndTime.getTime() - sessionStart.getTime()) / 1000)
        
        // Get user info
        const user = await users.findOne({ _id: session.userId })
        
        // Create time entry with start location
        await timeEntries.insertOne({
          userId: session.userId.toString(),
          date: sessionStart.toLocaleDateString("en-CA"),
          timeIn: sessionStart.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          }),
          timeOut: "10:00 PM",
          duration: duration,
          location: session.location || 'Location Unavailable',
          createdAt: now,
          updatedAt: now
        })

        // Stop the session
        await sessions.updateOne(
          { _id: session._id },
          { $set: { isActive: false, endTime: sessionEndTime } }
        )

        // Log auto-stop
        await logs.insertOne({
          action: 'timer_auto_stop',
          details: `Timer automatically stopped at 10:00 PM`,
          username: user?.username || 'Unknown',
          timestamp: now,
          ip: 'system'
        })

        stoppedCount++
      }
    }

    return NextResponse.json({ 
      success: true, 
      stoppedSessions: stoppedCount 
    })
  } catch (error) {
    console.error('Auto-stop error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}