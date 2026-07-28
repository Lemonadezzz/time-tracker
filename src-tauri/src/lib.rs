mod db;
mod idle;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Initialize the local SQLite database
      db::init_db(app.handle()).expect("Failed to initialize database");
      
      // Start background idle monitoring
      idle::start_idle_monitoring(app.handle().clone());
      
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        db::save_local_entry,
        db::get_local_entries,
        db::mark_entries_synced
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
