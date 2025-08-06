import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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
    
    // Get all time entries
    const timeEntries = await db.collection('timeentries').find({}).sort({ createdAt: -1 }).toArray()
    
    // Get all users
    const users = await db.collection('users').find({}).toArray()
    const userMap = new Map(users.map(user => [user._id.toString(), user.username]))
    
    // Combine entries with usernames
    const entries = timeEntries.map(entry => ({
      ...entry,
      username: userMap.get(entry.userId) || 'Unknown User'
    }))

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Team entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}