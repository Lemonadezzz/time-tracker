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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const sortOrder = searchParams.get('sort') || 'latest'

    const db = await getDatabase()
    const timeEntries = db.collection('timeentries')

    const matchConditions: any = { userId: user.userId.toString() }
    if (startDate && endDate) {
      matchConditions.date = { $gte: startDate, $lte: endDate }
    }

    const sortDirection = sortOrder === 'latest' ? -1 : 1
    
    const totalEntries = await timeEntries.countDocuments(matchConditions)
    const totalPages = Math.ceil(totalEntries / limit)

    const entries = await timeEntries
      .find(matchConditions)
      .sort({ createdAt: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    const processedEntries = entries.map(entry => ({
      _id: entry._id.toString(),
      date: entry.date,
      timeIn: entry.timeIn,
      timeOut: entry.timeOut,
      duration: entry.duration,
      location: entry.location || 'Location Unavailable',
      ipAddress: entry.ipAddress || 'Unknown',
      createdAt: entry.createdAt
    }))

    return NextResponse.json({ 
      entries: processedEntries,
      pagination: {
        currentPage: page,
        totalPages,
        totalEntries,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('Time logs error:', error)
    return NextResponse.json({ 
      error: 'Database error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
