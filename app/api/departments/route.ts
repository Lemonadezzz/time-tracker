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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const departments = await db.collection('departments')
      .find({})
      .sort({ name: 1 })
      .toArray()

    return NextResponse.json({ departments })
  } catch (error) {
    console.error('Departments API error:', error)
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

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    }

    const db = await getDatabase()
    const departments = db.collection('departments')

    const existingDept = await departments.findOne({ name })
    if (existingDept) {
      return NextResponse.json({ error: 'Department already exists' }, { status: 400 })
    }

    const result = await departments.insertOne({
      name,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      departmentId: result.insertedId 
    })
  } catch (error) {
    console.error('Create department error:', error)
    return NextResponse.json({ 
      error: 'Failed to create department', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
