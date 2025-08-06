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
    
    const entries = await db.collection('timeentries')
      .find({ userId: user.userId.toString() })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Time entries error:', error)
    return NextResponse.json({ 
      error: 'Database error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date, timeIn, timeOut, duration } = await request.json()

    const db = await getDatabase()

    const now = new Date()
    const result = await db.collection('timeentries').insertOne({
      userId: user.userId.toString(),
      date,
      timeIn,
      timeOut,
      duration,
      createdAt: now,
      updatedAt: now
    })

    return NextResponse.json({ 
      success: true, 
      entry: { _id: result.insertedId, date, timeIn, timeOut, duration }
    })
  } catch (error) {
    console.error('Time entries POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}