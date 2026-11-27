# Metropolitano de Lima App

[Descargar el APK para Android](https://metrolimaapp-android.vercel.app/metrolimaapp.apk). Abre el enlace desde tu teléfono, toca el archivo descargado y elige **Instalar**.

## Emulador Android en la laptop

En esta laptop abre una terminal y ejecuta `metrolima-demo`. También puedes iniciar el mismo lanzador desde esta carpeta:

```bash
./scripts/emular-demo.sh
```

El lanzador abre un teléfono virtual Android 15, instala el APK publicado y muestra la app. La primera ejecución crea el dispositivo `MetroLimaExpoGPS`. Si ya está abierto, el comando reutiliza esa ventana. El APK incluye el código de Expo y usa las APIs públicas por internet.

Toca **Pulsa para continuar** e inicia sesión con tu cuenta. Concede el permiso de ubicación de Android mientras usas la app. Después, abre **Rutas** y confirma la estación sugerida por el GPS. Elige un destino de la lista hacia el norte o hacia el sur y toca **Buscar ruta**. Desde **Alertas**, activa los avisos de viaje y toca **Probar notificación**. Android muestra el aviso también al terminar un recorrido simulado. El interruptor combina el permiso del teléfono y la preferencia de la cuenta en Neon. La pestaña **IA** está entre **Alertas** y **Cuenta**. Al terminar, cierra la ventana del emulador.

Para usar el lanzador en otra laptop Linux x86_64 se necesitan una sesión gráfica con systemd de usuario, KVM, JDK 21 y el SDK de Android con `platform-tools`, `emulator`, `cmdline-tools/latest` y la imagen `system-images;android-35;google_apis;x86_64`. Configura `ANDROID_HOME` y `JAVA_HOME` si tus instalaciones están en otras rutas. Si falta el APK en `artifacts/`, el lanzador descarga la versión publicada y verifica su SHA-256.

En **Inicio**, el apartado **Ubicación actual** muestra una estación de referencia. La última lectura del GPS se guarda cifrada en el dispositivo. Puedes actualizarla allí y cambiar los permisos en los ajustes de Android. En el emulador, usa **Extended controls → Location** para elegir el punto que entregará el GPS virtual.

## Desarrollo

Para consultar al asistente, inicia sesión, toca **IA** y elige una pregunta sugerida o escribe la tuya.

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

El APK se genera en `artifacts/metropolitano.apk`. El registro, las rutas y las recargas requieren las APIs activas. En **Rutas** puedes escoger A, B, C o D para ver sus estaciones, o **Todos** para comparar alternativas y transbordos. La [guía del proyecto](../../../backend/README.md) incluye la configuración de los servidores, el acceso por USB, las variables para Vercel y los comandos de verificación desde una copia limpia.
