import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/mongodb'

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

    return NextResponse.json({ 
      isTracking: !!activeSession,
      sessionStart: activeSession?.startTime || null
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
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'

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
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}