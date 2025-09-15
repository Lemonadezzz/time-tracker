import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

    const allUsers = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ users: allUsers })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ 
      error: 'Database error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { username, email, password, role } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await getDatabase()
    const users = db.collection('users')

    // Check if user already exists
    const existingUser = await users.findOne({ 
      $or: [{ username }, { email }] 
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const result = await users.insertOne({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      createdAt: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      userId: result.insertedId 
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ 
      error: 'Failed to create user', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}