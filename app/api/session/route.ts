import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/mongodb'
import { hashIpAddress } from '@/lib/ipHasher'

async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
    return decoded
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const sessions = db.collection('sessions')

    const activeSession = await sessions.findOne({
      userId: new ObjectId(user.userId),
      isActive: true
    })

    if (activeSession) {
      const sessionDate = new Date(activeSession.startTime)
      const now = new Date()
      // Use client timezone if available, otherwise fallback to server time
      const tz = request.headers.get('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone

      const sessionDateString = sessionDate.toLocaleDateString('en-CA', { timeZone: tz })
      const nowDateString = now.toLocaleDateString('en-CA', { timeZone: tz })

      // If session is from a previous day, auto-close it at 11:59 PM of that day
      if (sessionDateString !== nowDateString) {

        // Use a simple calculation to get seconds until 11:59:59 PM in the user's timezone
        const localTimeStr = sessionDate.toLocaleString('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const [hours, minutes, seconds] = localTimeStr.split(':').map(Number)
        // seconds from the session start time until midnight that same day
        const secondsUntilMidnight = (23 - hours) * 3600 + (59 - minutes) * 60 + (59 - seconds)
        const autoEndTime = new Date(sessionDate.getTime() + secondsUntilMidnight * 1000)

        const duration = secondsUntilMidnight

        // Auto-close session entry on previous day
        await db.collection('timeentries').insertOne({
          userId: user.userId.toString(),
          date: sessionDateString,
          timeIn: sessionDate.toLocaleTimeString("en-US", { timeZone: tz, hour12: true, hour: "2-digit", minute: "2-digit" }),
          timeOut: "11:59 PM",
          duration,
          location: activeSession.location || 'Location Unavailable',
          ipAddress: hashIpAddress(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'),
          createdAt: autoEndTime,
          updatedAt: autoEndTime,
        })

        await db.collection('action_logs').insertOne({
          userId: user.userId.toString(),
          action: 'time_out',
          timestamp: autoEndTime,
          location: activeSession.location || 'Location Unavailable',
          ipAddress: hashIpAddress(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'),
          username: user.username,
          note: 'Auto-closed at midnight'
        })

        await sessions.updateOne(
          { _id: activeSession._id },
          { $set: { isActive: false, endTime: autoEndTime } }
        )

        return NextResponse.json({ isTracking: false, sessionStart: null })
      }

      // Check if break time limit exceeded and auto-resume
      if (activeSession.isOnBreak && activeSession.breakStartTime) {
        const breakDuration = Math.floor((now.getTime() - new Date(activeSession.breakStartTime).getTime()) / 1000)
        const totalBreakTime = (activeSession.totalBreakTime || 0) + breakDuration
        const maxBreakTime = 90 * 60 // 1.5 hours in seconds
        
        if (totalBreakTime >= maxBreakTime) {
          // Add current break to break periods
          const breakPeriods = activeSession.breakPeriods || []
          breakPeriods.push({
            startTime: activeSession.breakStartTime,
            endTime: now,
            duration: breakDuration
          })
          
          // Auto-resume from break
          await sessions.updateOne(
            { _id: activeSession._id },
            { 
              $set: { 
                isOnBreak: false,
                totalBreakTime: maxBreakTime,
                breakPeriods: breakPeriods
              },
              $unset: { breakStartTime: 1 }
            }
          )
          
          // Log auto break end
          await db.collection('action_logs').insertOne({
            userId: user.userId.toString(),
            action: 'break_end',
            timestamp: now,
            location: activeSession.location || 'Location Unavailable',
            ipAddress: hashIpAddress(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'),
            username: user.username,
            duration: breakDuration,
            note: `Auto-resumed: Break limit reached (${Math.floor(breakDuration / 60)}m ${breakDuration % 60}s)`
          })
          
          return NextResponse.json({
            isTracking: true,
            isOnBreak: false,
            sessionStart: activeSession.startTime,
            breakTimeUsed: maxBreakTime,
            breakTimeRemaining: 0,
            autoResumed: true,
            breakPeriods: breakPeriods
          })
        }
      }
    }

    // Calculate daily break time used
    const today = new Date().toLocaleDateString('en-CA')
    const todaySessions = await sessions.find({
      userId: new ObjectId(user.userId),
      startTime: {
        $gte: new Date(today + 'T00:00:00.000Z'),
        $lt: new Date(today + 'T23:59:59.999Z')
      }
    }).toArray()

    let totalBreakTimeToday = 0
    for (const session of todaySessions) {
      totalBreakTimeToday += session.totalBreakTime || 0
    }

    // For break time remaining calculation, add current break time if on break
    let totalBreakTimeIncludingCurrent = totalBreakTimeToday
    if (activeSession?.isOnBreak && activeSession.breakStartTime) {
      const currentBreakTime = Math.floor((new Date().getTime() - new Date(activeSession.breakStartTime).getTime()) / 1000)
      totalBreakTimeIncludingCurrent += currentBreakTime
    }

    const maxBreakTime = 90 * 60 // 1.5 hours
    const breakTimeRemaining = Math.max(0, maxBreakTime - totalBreakTimeIncludingCurrent)

    return NextResponse.json({
      isTracking: !!activeSession,
      isOnBreak: activeSession?.isOnBreak || false,
      sessionStart: activeSession?.startTime || null,
      currentBreakStart: activeSession?.breakStartTime || null,
      breakTimeUsed: activeSession?.totalBreakTime || 0,
      breakTimeRemaining,
      breakPeriods: activeSession?.breakPeriods || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, location } = await request.json()
    const db = await getDatabase()
    const sessions = db.collection('sessions')
    const actionLogs = db.collection('action_logs')
    const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    const ipAddress = hashIpAddress(rawIp)

    if (action === 'start') {
      // End any existing active session
      await sessions.updateMany(
        { userId: new ObjectId(user.userId), isActive: true },
        { $set: { isActive: false, endTime: new Date() } }
      )

      // Start new session
      const now = new Date()
      await sessions.insertOne({
        userId: new ObjectId(user.userId),
        startTime: now,
        location: location || 'Location Unavailable',
        isActive: true,
        isOnBreak: false,
        createdAt: now
      })

      // Log time in action
      await actionLogs.insertOne({
        userId: user.userId.toString(),
        action: 'time_in',
        timestamp: now,
        location: location || 'Location Unavailable',
        ipAddress,
        username: user.username
      })

      // Log timer start
      const logs = db.collection('system_logs')
      await logs.insertOne({
        action: 'timer_start',
        details: `Started time tracking session`,
        username: user.username,
        timestamp: new Date(),
        ip: ipAddress
      })

      return NextResponse.json({ success: true, sessionStart: now })
    } else if (action === 'stop') {
      const now = new Date()

      // End active session
      await sessions.updateMany(
        { userId: new ObjectId(user.userId), isActive: true },
        { $set: { isActive: false, endTime: now } }
      )

      // Log time out action
      await actionLogs.insertOne({
        userId: user.userId.toString(),
        action: 'time_out',
        timestamp: now,
        location: location || 'Location Unavailable',
        ipAddress,
        username: user.username
      })

      // Log timer stop
      const logs = db.collection('system_logs')
      await logs.insertOne({
        action: 'timer_stop',
        details: `Stopped time tracking session`,
        username: user.username,
        timestamp: now,
        ip: ipAddress
      })

      return NextResponse.json({ success: true })
    } else if (action === 'break') {
      const activeSession = await sessions.findOne({
        userId: new ObjectId(user.userId),
        isActive: true
      })

      if (!activeSession) {
        return NextResponse.json({ error: 'No active session' }, { status: 400 })
      }

      // Check daily break time limit
      const today = new Date().toLocaleDateString('en-CA')
      const todaySessions = await sessions.find({
        userId: new ObjectId(user.userId),
        startTime: {
          $gte: new Date(today + 'T00:00:00.000Z'),
          $lt: new Date(today + 'T23:59:59.999Z')
        }
      }).toArray()

      let totalBreakTimeToday = 0
      for (const session of todaySessions) {
        totalBreakTimeToday += session.totalBreakTime || 0
      }

      const maxBreakTime = 90 * 60 // 1.5 hours in seconds
      if (totalBreakTimeToday >= maxBreakTime) {
        return NextResponse.json({ 
          error: 'Daily break limit reached',
          breakTimeUsed: totalBreakTimeToday,
          breakTimeRemaining: 0
        }, { status: 400 })
      }

      // Set session to break mode
      await sessions.updateOne(
        { _id: activeSession._id },
        { 
          $set: { 
            isOnBreak: true,
            breakStartTime: new Date()
          }
        }
      )

      // Log break start action
      await actionLogs.insertOne({
        userId: user.userId.toString(),
        action: 'break_start',
        timestamp: new Date(),
        location: activeSession.location || 'Location Unavailable',
        ipAddress,
        username: user.username,
        note: `Break time remaining: ${Math.floor((maxBreakTime - totalBreakTimeToday) / 60)} minutes`
      })

      return NextResponse.json({ 
        success: true,
        breakTimeRemaining: maxBreakTime - totalBreakTimeToday
      })
    } else if (action === 'resume') {
      const activeSession = await sessions.findOne({
        userId: new ObjectId(user.userId),
        isActive: true,
        isOnBreak: true
      })

      if (!activeSession || !activeSession.breakStartTime) {
        return NextResponse.json({ error: 'No active break session' }, { status: 400 })
      }

      // Calculate break duration
      const now = new Date()
      const breakDuration = Math.floor((now.getTime() - new Date(activeSession.breakStartTime).getTime()) / 1000)
      const newTotalBreakTime = (activeSession.totalBreakTime || 0) + breakDuration

      // Add completed break to break periods
      const breakPeriods = activeSession.breakPeriods || []
      breakPeriods.push({
        startTime: activeSession.breakStartTime,
        endTime: now,
        duration: breakDuration
      })

      // Resume session from break
      await sessions.updateOne(
        { _id: activeSession._id },
        { 
          $set: { 
            isOnBreak: false,
            totalBreakTime: newTotalBreakTime,
            breakPeriods: breakPeriods
          },
          $unset: { breakStartTime: 1 }
        }
      )

      // Log break end action
      await actionLogs.insertOne({
        userId: user.userId.toString(),
        action: 'break_end',
        timestamp: now,
        location: activeSession.location || 'Location Unavailable',
        ipAddress,
        username: user.username,
        duration: breakDuration,
        note: `Break duration: ${Math.floor(breakDuration / 60)}m ${breakDuration % 60}s`
      })

      const maxBreakTime = 90 * 60
      return NextResponse.json({ 
        success: true,
        breakTimeUsed: newTotalBreakTime,
        breakTimeRemaining: Math.max(0, maxBreakTime - newTotalBreakTime),
        breakPeriods: breakPeriods
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}