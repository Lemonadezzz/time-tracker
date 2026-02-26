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

    // Check if user has admin access
    if (user.role !== 'admin' && user.role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const sortOrder = searchParams.get('sort') || 'latest'
    const username = searchParams.get('user')

    const db = await getDatabase()
    const actionLogs = db.collection('action_logs')

    const matchConditions: any = { 
      action: { $in: ['time_in', 'time_out'] }
    }
    
    if (username && username !== 'all') {
      matchConditions.username = username
    }
    
    if (startDate && endDate) {
      matchConditions.timestamp = { 
        $gte: new Date(startDate + 'T00:00:00'),
        $lte: new Date(endDate + 'T23:59:59')
      }
    }

    const sortDirection = sortOrder === 'latest' ? -1 : 1
    
    const totalEntries = await actionLogs.countDocuments(matchConditions)
    const totalPages = Math.ceil(totalEntries / limit)

    const logs = await actionLogs
      .find(matchConditions)
      .sort({ timestamp: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    const processedLogs = logs.map(log => ({
      _id: log._id.toString(),
      username: log.username,
      action: log.action,
      timestamp: log.timestamp,
      location: log.location || 'Location Unavailable',
      ipAddress: log.ipAddress || 'Unknown'
    }))

    return NextResponse.json({ 
      logs: processedLogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalEntries,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('Team action logs error:', error)
    return NextResponse.json({ 
      error: 'Database error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
