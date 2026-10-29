use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // En macOS el WebView necesita permiso para reproducir audio sin gesto previo.
            #[cfg(target_os = "macos")]
            {
                let _ = app.get_webview_window("main");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error al arrancar Play2");
}
