import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Play2 movil + Android TV.
 *
 * El APK carga la SPA ya compilada en `apps/web/dist`.
 * La API se resuelve con `VITE_API_URL` en el momento del build
 * (por defecto `http://<ip-de-la-api>:4000/api`), porque dentro del
 * WebView no existe el proxy de Vite ni rutas relativas utiles.
 */
const config: CapacitorConfig = {
  appId: 'com.play2.app',
  appName: 'Play2',
  webDir: '../web/dist',
  android: {
    // La API local va por http, no https.
    allowMixedContent: true,
  },
  server: {
    // `http` y no `https`: con https el WebView de Android TV bloquea las
    // peticiones a la API local (http://192.168.x.x:4000) por contenido mixto,
    // y `allowMixedContent` no se respeta en los WebView de TV. Con http el
    // origen es http://localhost y la API por LAN deja de ser contenido mixto.
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
