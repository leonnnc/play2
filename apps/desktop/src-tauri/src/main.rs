// Play2 escritorio: arranca el WebView con la SPA ya compilada.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    play2_lib::run()
}
