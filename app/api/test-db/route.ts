import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('timetracker')
    const users = await db.collection('users').findOne({})
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected',
      userFound: !!users
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}