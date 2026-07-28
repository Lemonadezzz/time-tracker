use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use std::fs;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LocalTimeEntry {
    pub id: Option<String>,
    pub user_id: String,
    pub entry_type: String, // "start", "stop", "idle"
    pub timestamp: String,
    pub synced: bool,
}

pub struct DbState {
    pub db: Mutex<Connection>,
}

pub fn init_db(app: &AppHandle) -> SqlResult<()> {
    // In a real app, use app.path().app_data_dir().unwrap()
    // For now, we'll store it locally or gracefully fallback
    let db_path = match app.path().app_data_dir() {
        Ok(dir) => {
            fs::create_dir_all(&dir).unwrap_or(());
            dir.join("time_tracker.db")
        }
        Err(_) => std::path::PathBuf::from("time_tracker.db"),
    };

    let conn = Connection::open(db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS local_time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            entry_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )",
        (), // empty list of parameters
    )?;

    app.manage(DbState {
        db: Mutex::new(conn),
    });

    Ok(())
}

#[tauri::command]
pub fn save_local_entry(state: State<'_, DbState>, entry: LocalTimeEntry) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO local_time_entries (user_id, entry_type, timestamp, synced) VALUES (?1, ?2, ?3, ?4)",
        (&entry.user_id, &entry.entry_type, &entry.timestamp, if entry.synced { 1 } else { 0 }),
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_local_entries(state: State<'_, DbState>, synced: bool) -> Result<Vec<LocalTimeEntry>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let sync_val = if synced { 1 } else { 0 };
    
    let mut stmt = conn.prepare("SELECT id, user_id, entry_type, timestamp, synced FROM local_time_entries WHERE synced = ?1").map_err(|e| e.to_string())?;
    
    let entry_iter = stmt.query_map([sync_val], |row| {
        Ok(LocalTimeEntry {
            id: Some(row.get::<_, i32>(0)?.to_string()),
            user_id: row.get(1)?,
            entry_type: row.get(2)?,
            timestamp: row.get(3)?,
            synced: row.get::<_, i32>(4)? == 1,
        })
    }).map_err(|e| e.to_string())?;

    let mut entries = Vec::new();
    for entry in entry_iter {
        if let Ok(e) = entry {
            entries.push(e);
        }
    }

    Ok(entries)
}

#[tauri::command]
pub fn mark_entries_synced(state: State<'_, DbState>, ids: Vec<String>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    // Simplistic approach for sqlite IN clause
    for id in ids {
        conn.execute("UPDATE local_time_entries SET synced = 1 WHERE id = ?1", [&id])
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}
