# Metropolitano Lima App

Primera implementación móvil del prototipo `docs/reference/metropolitano_perfil.html`. React Native, NativeWind (Tailwind CSS), Lucide React Native y Spring Boot con Java 21. Es una **demostración académica**, sin conexión oficial con ATU, tarjeta física, buses, Yape o cobros bancarios.

## Qué se puede probar

- Splash y acceso de demostración, cuatro pestañas y las ocho pantallas originales.
- Búsqueda local de estaciones, doce planes de ejemplo, detalle y viaje simulado cancelable.
- Cuenta con tarjeta ficticia, saldo, historial y recargas simuladas.
- Perfil editable, validación, cancelación y nombre compartido entre Inicio, Cuenta y Perfil.
- Preferencias y lectura global de alertas persistentes con backend.
- Sesiones demo de una hora; cierre revoca el token y limpia datos móviles.
- Pantallas informativas de medios de pago, seguridad, privacidad y ayuda: no prometen funciones externas inexistentes.

Colores, fuentes e imágenes provienen del HTML final. Las fotografías y logotipos se incluyen como activos locales; fuentes y atribuciones se documentan en assets/images/CREDITS.md del proyecto móvil. Manrope y Fraunces se incluyen con sus licencias OFL.

## Estructura

```text
backend/metropolitano-backend-api/                    Spring Boot 4.1.1 / Java 21
frontend/metropolitano-mobile-app/MetropolitanoMobileApp/  React Native 0.87.1
docs/METROPOLITANO_DESARROLLO.md                       Especificación extensa
docs/reference/metropolitano_perfil.html              Referencia original
docs/IMPLEMENTACION.md                                Estado y diferencias
```

El proyecto móvil ya estaba registrado como repositorio Git anidado (gitlink) en la carpeta madre. Se conservó esa estructura y no se hicieron commits. Para versionar la entrega hay que guardar los cambios en el repositorio móvil y luego actualizar su referencia en el padre; el padre por sí solo no registra cada archivo móvil. No se modificó el historial ni se eliminaron metadatos Git.

## Backend local

Requisitos: Java 21. El wrapper de Maven está incluido.

```powershell
Set-Location C:\Users\df10x\Documents\GitHub\itd-repository\backend\metropolitano-backend-api
.\mvnw.cmd spring-boot:run
```

Por defecto se activa el perfil `demo` y una base H2 local persistente en `data/metropolitano-demo`. No exige instalar un servidor de base de datos para probar. Flyway administra el esquema; Hibernate lo valida. Esta base es exclusivamente de prueba.

La configuración inicial del usuario ya incluía MySQL. Se conserva y puede utilizarse también para la demo:

```powershell
$env:DB_URL = 'jdbc:mysql://localhost:3306/metropolitano_demo'
$env:DB_USER = 'metropolitano'
$env:DB_PASSWORD = '<contraseña local>'
.\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=demo,mysql'
```

Crear previamente la base y el usuario con permisos adecuados. MySQL no se ensayó en este entorno; las pruebas de persistencia usan H2. No introducir datos personales reales: cualquier persona que conozca el celular de un fixture puede abrir ese mismo usuario demo. Esto no es autenticación de producción. Un DNI válido en formato no acredita identidad.

`GET http://localhost:8080/actuator/health` comprueba arranque. En demo, Swagger está en `http://localhost:8080/swagger-ui/index.html` y OpenAPI en `/v3/api-docs`. Cada recurso privado de `/api/v1/demo/**` exige su token demo. Sin perfil demo, la aplicación deniega todas las rutas salvo health. No publicar este perfil en Internet.

## Móvil

Requisitos: Node compatible con el proyecto, Android SDK para Android y Xcode/macOS para iOS. Instalar dependencias si se clona de nuevo:z

```powershell
Set-Location C:\Users\df10x\Documents\GitHub\itd-repository\frontend\metropolitano-mobile-app\MetropolitanoMobileApp
npm ci
npm start
```

En otra terminal, con un emulador o dispositivo conectado:

```powershell
npm run android
```

En esta ruta de Windows utiliza el alias corto explicado más abajo también para `npm start` y `npm run android` (desde `M:\`). Evita regenerar cachés nativas desde la ruta larga.

Al entrar, usar celular ficticio `987654321` y DNI `76543210`. “Ingresar a la demo conectada” consulta Spring; “Explorar demo sin conexión” permite navegar sin backend, con cambios solo en memoria. El token conectado tampoco se persiste en almacenamiento móvil; al reiniciar la app se vuelve a ingresar y se recuperan los datos del backend usando el **celular original de acceso**. Cambiar el celular en Perfil cambia el dato visible, no ese identificador demo.

La API se configura en `src/api.ts` y usa `http://localhost:8080/api/v1/demo`. Para Android por USB o emulador, ejecutar `adb reverse tcp:8080 tcp:8080`; `android:usb` configura este enlace automáticamente junto al de Metro. Después de reconectar el teléfono puede ser necesario repetirlo. Usar HTTP solo en desarrollo; una futura versión real necesitará HTTPS y autenticación propia. No hay conexión automática a un proveedor público.

Las fuentes ya están enlazadas. Para cambiar o volver a enlazar activos: `npx react-native-asset`. En iOS ejecutar la instalación de pods siguiendo el README móvil original y reconstruir en macOS; no se compiló iOS desde Windows.

### Rutas largas en Windows

Para un telefono Android por USB, la opcion recomendada es ejecutar desde la carpeta movil `npm run start:usb -- --port 8082` y, en otra terminal, `npm run android:usb -- --port 8082`. Estos comandos crean/verifican M: en la sesion del usuario. El segundo conecta el puerto USB y usa `--no-packager`, por lo que no intenta abrir un segundo Metro. `npm run check:usb` comprueba el alias sin instalar nada. Una unidad M: que pertenezca a otra carpeta no se modifica.

La ruta completa del móvil supera límites prácticos de CMake/Ninja en dependencias nativas. Se puede crear un alias de unidad sin mover archivos:

```powershell
subst M: 'C:\Users\df10x\Documents\GitHub\itd-repository\frontend\metropolitano-mobile-app\MetropolitanoMobileApp'
Set-Location M:\android
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Usar una letra libre. Las cachés de un primer intento por la ruta larga fueron conservadas con sufijo `-longpath-backup`, dentro de directorios de compilación ignorados por Git. El alias M: se utiliza para la compilación, no cambia la carpeta madre. Tras cerrar procesos que dependan de él, se puede retirar con `subst M: /D`.

El APK debug requiere Metro para cargar JavaScript. El bundle aislado verifica JavaScript/CSS; no convierte automáticamente ese APK en distribución autónoma. Para otra ABI, ajustar `reactNativeArchitectures` y compilarla. No se ha preparado firma de publicación.

## API implementada

Todas las rutas siguientes pertenecen a este proyecto; **no son servicios de ATU**.

| Ruta | Acción |
|---|---|
| POST `/api/v1/demo/sessions` | `{phone,dni}` → token ficticio |
| DELETE `/api/v1/demo/sessions/current` | Revocar sesión |
| GET `/api/v1/demo/state` | Perfil, saldo, preferencias, fixtures y últimas 50 recargas |
| PATCH `/api/v1/demo/me` | `{fullName,phone,dni,email,version}` |
| PATCH `/api/v1/demo/preferences` | `{notifications}` |
| POST `/api/v1/demo/alerts/read-all` | Lectura global de ejemplos |
| POST `/api/v1/demo/recharges` | `{amount,method}` y cabecera `Idempotency-Key` |

Rutas privadas: `Authorization: Bearer <token>`. Métodos permitidos de recarga: `YAPE_DEMO` y `CARD_DEMO`. Importes: 5, 10, 20 o 50 PEN. Dinero decimal exacto en servidor. La clave idempotente se conserva al reintentar; cambiar importe o método con la misma clave genera 409. La transacción bloquea la cuenta para evitar perder actualizaciones simultáneas. Cada recarga guarda importe, método y saldo posterior; los tres movimientos iniciales son ilustrativos, no un ledger contable completo.

## Verificación

```powershell
# Dentro del backend
.\mvnw.cmd test
# Dentro del móvil
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

Las pruebas cubren validación, estado compartido, limpieza al salir, recarga sin duplicados, concurrencia en servidor, persistencia entre sesiones e independencia de usuarios. Las cifras y comprobaciones de la entrega se registran en `docs/IMPLEMENTACION.md`.

## Límites de esta entrega

Es la base de desarrollo demo, no la totalidad de los hitos de la especificación. Pendientes: autenticación real, almacenamiento seguro de credenciales persistentes, lectura individual de alertas, recuperación de sesión y errores de sesión vencida, catálogo validado, integración GPS/push, ledger completo, gestión bancaria, pruebas en dispositivo, comparación visual renderizada y compilación iOS. El inventario público de dependencias conserva avisos de seguridad que requieren revisión antes de producción; se aplicaron correcciones compatibles sin forzar cambios de versiones mayores.

## Vista web y evidencias

Desde la carpeta móvil ejecuta `npm run web` y abre http://127.0.0.1:5173/. Para el modo conectado, Spring debe estar iniciado en el puerto 8080. `npm run build:web` genera build/web; el proxy de desarrollo requiere una configuración equivalente al desplegar.

La web comparte datos y lógica con el móvil y permite validar los flujos en navegador. Incluye planeador entre estaciones, tablero y QR simulados. Consulta docs/RESULTADOS_VALIDACION_MVP.md y docs/evidence para los resultados y las capturas.
