use device_query::{DeviceQuery, DeviceState};
use serde::Serialize;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Clone)]
struct IdleEvent {
    is_idle: bool,
    idle_duration_secs: u64,
}

pub fn start_idle_monitoring(app: AppHandle) {
    std::thread::spawn(move || {
        let device_state = DeviceState::new();
        let mut last_active = Instant::now();
        let mut last_mouse_pos = device_state.get_mouse().coords;
        let mut last_keys = device_state.get_keys();
        let mut was_idle = false;
        
        let idle_threshold = Duration::from_secs(300); // 5 minutes

        loop {
            std::thread::sleep(Duration::from_millis(1000));

            let current_mouse_pos = device_state.get_mouse().coords;
            let current_keys = device_state.get_keys();

            let mouse_moved = current_mouse_pos != last_mouse_pos;
            let keys_changed = current_keys != last_keys;

            if mouse_moved || keys_changed {
                last_active = Instant::now();
                last_mouse_pos = current_mouse_pos;
                last_keys = current_keys;

                if was_idle {
                    was_idle = false;
                    let _ = app.emit("idle-status-changed", IdleEvent {
                        is_idle: false,
                        idle_duration_secs: 0,
                    });
                }
            } else {
                let duration_since_active = last_active.elapsed();
                if duration_since_active > idle_threshold && !was_idle {
                    was_idle = true;
                    let _ = app.emit("idle-status-changed", IdleEvent {
                        is_idle: true,
                        idle_duration_secs: duration_since_active.as_secs(),
                    });
                }
            }
        }
    });
}
