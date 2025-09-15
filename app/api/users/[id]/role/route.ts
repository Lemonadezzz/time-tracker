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

    const { role } = await request.json()
    if (!['admin', 'user', 'developer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const db = await getDatabase()
    const users = db.collection('users')

    await users.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { role, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}