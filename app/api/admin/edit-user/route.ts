import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, username, password } = await request.json()

    if (!userId || !username) {
      return NextResponse.json({ error: 'User ID and username required' }, { status: 400 })
    }

    const db = await getDatabase()
    const users = db.collection('users')

    const updateData: any = {
      username,
      updatedAt: new Date()
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}