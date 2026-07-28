"use client"

import { useEffect, useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface LocalEntry {
  id?: string;
  user_id: string;
  entry_type: string;
  timestamp: string;
  synced: boolean;
}

export default function DesktopTracker() {
  const [status, setStatus] = useState('Idle')
  const [syncStatus, setSyncStatus] = useState('All synced')
  const isTracking = useRef(false)

  // NOTE: Replace with real user ID from your auth context
  const USER_ID = "desktop-user-123"

  const saveEntry = async (type: string) => {
    try {
      await invoke('save_local_entry', {
        entry: {
          user_id: USER_ID,
          entry_type: type,
          timestamp: new Date().toISOString(),
          synced: false
        }
      })
      console.log(`Saved local entry: ${type}`)
    } catch (e) {
      console.error("Failed to save entry", e)
    }
  }

  const handleStart = () => {
    setStatus('Tracking')
    isTracking.current = true
    saveEntry('start')
  }

  const handleStop = () => {
    setStatus('Idle')
    isTracking.current = false
    saveEntry('stop')
  }

  useEffect(() => {
    // Listen for idle events from Rust
    const unlistenIdle = listen('idle-status-changed', (event: any) => {
      const payload = event.payload as { is_idle: boolean, idle_duration_secs: number }
      
      if (payload.is_idle && isTracking.current) {
        console.log(`Idle detected for ${payload.idle_duration_secs}s`)
        setStatus('Idle (Auto)')
        saveEntry('idle')
      } else if (!payload.is_idle && status.includes('Auto')) {
        // Automatically resume if they come back from auto-idle
        setStatus('Tracking')
        saveEntry('start')
      }
    })

    // Background Sync Worker
    const syncWorker = setInterval(async () => {
      try {
        const unsynced: LocalEntry[] = await invoke('get_local_entries', { synced: false })
        if (unsynced.length === 0) {
          setSyncStatus('All synced')
          return
        }

        setSyncStatus(`Syncing ${unsynced.length} entries...`)
        
        // POST to our Vercel API
        const response = await fetch('/api/sync-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: unsynced })
        })

        if (response.ok) {
          const idsToMark = unsynced.map(e => e.id)
          await invoke('mark_entries_synced', { ids: idsToMark })
          setSyncStatus('All synced')
        } else {
          setSyncStatus('Sync failed, retrying later')
        }
      } catch (e) {
        console.error("Sync error:", e)
        setSyncStatus('Offline')
      }
    }, 15000) // Sync every 15 seconds

    return () => {
      unlistenIdle.then(f => f())
      clearInterval(syncWorker)
    }
  }, [status])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Time Tracker Desktop</h1>
      <div className="bg-card p-6 rounded-xl shadow-lg border w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <span className="text-muted-foreground">Status</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.includes('Tracking') ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
            {status}
          </span>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleStart}
            disabled={status === 'Tracking'}
            className="flex-1 bg-primary text-primary-foreground py-2 rounded-md font-semibold hover:bg-primary/90 transition disabled:opacity-50"
          >
            Start Shift
          </button>
          <button 
            onClick={handleStop}
            disabled={status === 'Idle'}
            className="flex-1 border bg-background py-2 rounded-md font-semibold hover:bg-accent transition disabled:opacity-50"
          >
            Stop Shift
          </button>
        </div>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Sync status: {syncStatus}</p>
    </div>
  )
}
