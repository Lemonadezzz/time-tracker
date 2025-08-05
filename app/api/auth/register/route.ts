import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('timetracker')
    const users = db.collection('users')

    const existingUser = await users.findOne({ username })
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const now = new Date()

    // Check if this is the first user (developer account)
    const userCount = await users.countDocuments()
    const role = userCount === 0 ? 'admin' : 'user'

    const result = await users.insertOne({
      username,
      password: hashedPassword,
      role,
      createdAt: now,
      updatedAt: now
    })

    return NextResponse.json({ 
      success: true, 
      user: { username, id: result.insertedId }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}