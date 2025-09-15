import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
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

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const db = await getDatabase()
    const logs = db.collection('system_logs')

    const systemLogs = await logs.find({})
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()

    const serializedLogs = systemLogs.map(log => ({
      ...log,
      _id: log._id.toString()
    }))

    return NextResponse.json({ logs: serializedLogs })
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

    const { action, details, username } = await request.json()
    const db = await getDatabase()
    const logs = db.collection('system_logs')

    await logs.insertOne({
      action,
      details,
      username: username || user.username,
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}