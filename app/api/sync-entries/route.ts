import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json()

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // The desktop sends atomic events (start, stop, idle) with timestamps.
    // In a full implementation, you would write logic here to match "start" with "stop" 
    // to calculate the exact duration, or simply append them to an event stream collection.
    // For this implementation, we will append them to a new 'time_events' collection
    // to preserve the raw offline data without immediately corrupting the legacy aggregated model.

    if (entries.length > 0) {
        await db.collection('time_events').insertMany(entries.map(e => ({
            userId: e.user_id,
            eventType: e.entry_type,
            timestamp: new Date(e.timestamp),
            source: 'desktop_client',
            createdAt: new Date()
        })))
    }

    return NextResponse.json({ success: true, syncedCount: entries.length })
  } catch (error) {
    console.error('Sync entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
