import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const sessions = db.collection('sessions')
    const timeEntries = db.collection('timeentries')
    const logs = db.collection('system_logs')
    const users = db.collection('users')

    // Find all active sessions that are older than today
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const oldActiveSessions = await sessions.find({ 
      isActive: true,
      startTime: { $lt: today }
    }).toArray()
    
    let cleanedCount = 0

    for (const session of oldActiveSessions) {
      const sessionStart = new Date(session.startTime)
      
      // Set end time to 10pm of the same day the session started
      const endTime = new Date(sessionStart)
      endTime.setHours(22, 0, 0, 0)
      
      // Calculate duration until 10pm of start date
      const duration = Math.floor((endTime.getTime() - sessionStart.getTime()) / 1000)
      
      // Get user info
      const user = await users.findOne({ _id: session.userId })
      
      // Create time entry ending at 10pm of start date
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

      // Stop the session
      await sessions.updateOne(
        { _id: session._id },
        { $set: { isActive: false, endTime: endTime } }
      )

      // Log cleanup
      await logs.insertOne({
        action: 'session_cleanup',
        details: `Cleaned up session, ended at 10:00 PM`,
        username: user?.username || 'Unknown',
        timestamp: now,
        ip: 'system'
      })

      cleanedCount++
    }

    return NextResponse.json({ 
      success: true, 
      cleanedSessions: cleanedCount
    })
  } catch (error) {
    console.error('Session cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}