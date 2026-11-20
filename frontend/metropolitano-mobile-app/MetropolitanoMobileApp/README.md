# Metropolitano Lima en Expo

La carpeta contiene el cliente Android, los componentes comunes y la vista web de Vite. Expo prebuild genera Android e iOS desde app.json. Los recursos de la aplicación viven en assets/. Para desarrollo usa Node 24.3+ o 26 y Expo SDK 58; para el APK local se requiere JDK 21 y Android SDK.

```bash
npm ci
npm start
npm run android
npm run apk
npm test -- --runInBand
npm run web
npm run build:web
```

El APK se genera en `artifacts/metropolitano.apk`. El registro, la presentación, las rutas y las recargas requieren las APIs activas. La [guía del proyecto](../../../README.md) incluye la configuración de los servidores, el acceso por USB, las variables para Vercel y los comandos de verificación desde una copia limpia.
