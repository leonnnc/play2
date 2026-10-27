import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// PWA: en producción el service worker se actualiza solo.
// En dev no existe el SW, así que se ignora silenciosamente.
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      console.info('[Play2] Listo para usarse sin conexión.');
    },
    onRegisterError(error) {
      console.warn('[Play2] No se pudo registrar el service worker:', error);
    },
  });
}
