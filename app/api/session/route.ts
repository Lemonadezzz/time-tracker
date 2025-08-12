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

    const { action } = await request.json()
    const db = await getDatabase()
    const sessions = db.collection('sessions')

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
        isActive: true,
        createdAt: now
      })

      return NextResponse.json({ success: true, sessionStart: now })
    } else if (action === 'stop') {
      // End active session
      await sessions.updateMany(
        { userId: new ObjectId(user.userId), isActive: true },
        { $set: { isActive: false, endTime: new Date() } }
      )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}