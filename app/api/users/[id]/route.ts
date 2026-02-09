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

    const body = await request.json()
    const { username, email, role, departmentId } = body
    const userId = params.id

    const db = await getDatabase()
    const users = db.collection('users')

    // If only updating department (bulk operation)
    if (departmentId !== undefined && !username && !email) {
      const updateOp = departmentId === null || departmentId === '' 
        ? { $unset: { departmentId: '' } }
        : { $set: { departmentId, updatedAt: new Date() } }
      
      const result = await users.updateOne({ _id: new ObjectId(userId) }, updateOp)
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      return NextResponse.json({ success: true })
    }

    if (!username || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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
    const updateData: any = { 
      username, 
      email, 
      role: role || 'user',
      updatedAt: new Date()
    }
    
    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === '') {
        updateData.$unset = { departmentId: '' }
      } else {
        updateData.departmentId = departmentId
      }
    }

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      departmentId === null || departmentId === '' 
        ? { $set: updateData, $unset: { departmentId: '' } }
        : { $set: updateData }
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
    if (!user || user.role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    const db = await getDatabase()
    const users = db.collection('users')
    const timeEntries = db.collection('timeentries')
    const sessions = db.collection('sessions')

    // Prevent deleting yourself
    if (user.userId === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete user and all associated data
    const userResult = await users.deleteOne({ _id: new ObjectId(userId) })

    if (userResult.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete all time entries for this user
    await timeEntries.deleteMany({ userId: userId })
    
    // Delete all sessions for this user
    await sessions.deleteMany({ userId: new ObjectId(userId) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete user', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}