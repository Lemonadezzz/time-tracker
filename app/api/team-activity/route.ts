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

    const db = await getDatabase()
    const timeEntries = db.collection('timeentries')

    // Get last 365 days of data
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const activityData = await timeEntries.aggregate([
      {
        $match: {
          date: { $gte: oneYearAgo.toISOString().split('T')[0] },
          timeOut: { $ne: null },
          duration: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$date',
          totalDuration: { $sum: '$duration' },
          uniqueUsers: { $addToSet: '$username' }
        }
      },
      {
        $project: {
          date: '$_id',
          totalHours: { $divide: ['$totalDuration', 3600] },
          activeUsers: { $size: '$uniqueUsers' }
        }
      }
    ]).toArray()

    return NextResponse.json({ activityData })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}