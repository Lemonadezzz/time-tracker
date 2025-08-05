import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import clientPromise from '@/lib/mongodb'
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

    const client = await clientPromise
    const db = client.db('timetracker')
    
    const pipeline = [
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
      {
        $unwind: '$user'
      },
      {
        $project: {
          date: 1,
          timeIn: 1,
          timeOut: 1,
          duration: 1,
          createdAt: 1,
          username: '$user.username'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    const entries = await db.collection('timeentries').aggregate(pipeline).toArray()

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Team entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}