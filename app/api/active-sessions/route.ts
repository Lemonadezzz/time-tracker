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

    // Get all active sessions with user details
    const activeSessions = await sessions.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: { $toString: '$userId' },
          username: '$user.username',
          startTime: 1,
          createdAt: 1
        }
      }
    ]).toArray()

    // Convert ObjectIds to strings for JSON serialization
    const serializedSessions = activeSessions.map(session => ({
      ...session,
      _id: session._id?.toString(),
      userId: session.userId?.toString()
    }))

    return NextResponse.json({ activeSessions: serializedSessions })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}