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

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { username, password, role } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    if (!['admin', 'user', 'developer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const db = await getDatabase()
    const users = db.collection('users')

    const existingUser = await users.findOne({ username })
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const now = new Date()

    await users.insertOne({
      username,
      password: hashedPassword,
      role,
      createdAt: now,
      updatedAt: now
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}