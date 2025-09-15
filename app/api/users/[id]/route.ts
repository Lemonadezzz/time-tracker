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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromToken(request)
    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { username, email, role } = await request.json()
    const userId = params.id

    if (!username || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await getDatabase()
    const users = db.collection('users')

    // Check if another user has the same username or email
    const existingUser = await users.findOne({ 
      $and: [
        { _id: { $ne: new ObjectId(userId) } },
        { $or: [{ username }, { email }] }
      ]
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 })
    }

    // Update user
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          username, 
          email, 
          role: role || 'user',
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ 
      error: 'Failed to update user', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromToken(request)
    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    const db = await getDatabase()
    const users = db.collection('users')

    // Prevent deleting yourself
    if (user.userId === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const result = await users.deleteOne({ _id: new ObjectId(userId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete user', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}