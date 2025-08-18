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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const selectedUser = searchParams.get('user')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const sortOrder = searchParams.get('sort') || 'latest'

    const db = await getDatabase()
    const timeEntries = db.collection('timeentries')

    // Build match conditions
    const matchConditions: any = {}
    if (startDate && endDate) {
      matchConditions.date = { $gte: startDate, $lte: endDate }
    }

    // Aggregation pipeline for server-side consolidation
    const pipeline = [
      { $match: matchConditions },
      {
        $addFields: {
          userObjectId: { $toObjectId: '$userId' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userObjectId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $addFields: {
          username: '$user.username'
        }
      }
    ]

    // Filter by user if specified
    if (selectedUser && selectedUser !== 'all') {
      pipeline.push({ $match: { username: selectedUser } })
    }

    // Group by user and date for consolidation
    pipeline.push(
      {
        $group: {
          _id: { username: '$username', date: '$date' },
          entries: { 
            $push: {
              _id: '$_id',
              timeIn: '$timeIn',
              timeOut: '$timeOut',
              duration: '$duration',
              createdAt: '$createdAt'
            }
          },
          firstEntry: { $first: '$$ROOT' }
        }
      },
      {
        $addFields: {
          username: '$_id.username',
          date: '$_id.date',
          sortDate: { $dateFromString: { dateString: '$_id.date' } }
        }
      },
      {
        $sort: sortOrder === 'latest' ? { sortDate: -1 } : { sortDate: 1 }
      }
    )

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }]
    const countResult = await timeEntries.aggregate(countPipeline).toArray()
    const totalEntries = countResult[0]?.total || 0
    const totalPages = Math.ceil(totalEntries / limit)

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit }
    )

    const entries = await timeEntries.aggregate(pipeline).toArray()

    // Process consolidated entries
    const processedEntries = entries.map(dayGroup => {
      const validEntries = dayGroup.entries.filter(entry => entry.timeIn && entry.timeOut)
      
      if (validEntries.length === 0) {
        return {
          _id: dayGroup.firstEntry._id,
          username: dayGroup.username,
          date: dayGroup.date,
          timeIn: null,
          timeOut: null,
          duration: 0,
          totalDuration: 0,
          entries: dayGroup.entries
        }
      }

      // Sort entries by time in
      const sortedEntries = validEntries.sort((a, b) => {
        const timeA = new Date(`1970-01-01 ${a.timeIn}`).getTime()
        const timeB = new Date(`1970-01-01 ${b.timeIn}`).getTime()
        return timeA - timeB
      })

      const earliestTimeIn = sortedEntries[0].timeIn
      const latestTimeOut = sortedEntries[sortedEntries.length - 1].timeOut
      
      // Calculate total duration (sum of all individual durations)
      const totalDuration = validEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

      return {
        _id: dayGroup.firstEntry._id,
        username: dayGroup.username,
        date: dayGroup.date,
        timeIn: earliestTimeIn,
        timeOut: latestTimeOut,
        duration: totalDuration, // Total worked time
        totalDuration: totalDuration, // Same as duration for consistency
        entries: dayGroup.entries // All individual entries for timeline
      }
    })

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
    console.error('Team time entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}