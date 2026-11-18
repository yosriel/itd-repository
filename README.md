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

El módulo [APF3](apf3/README.md) implementa un microservicio Python reproducible
para búsqueda y modelos con datos sintéticos. El planeador web y móvil conectado
consume sus resultados; las pantallas offline conservan su cálculo local. No
reemplaza las alertas, el backend Java, ni es un sistema oficial o en tiempo real.

```text
backend/metropolitano-backend-api/                    Spring Boot 4.1.1 / Java 21
frontend/metropolitano-mobile-app/MetropolitanoMobileApp/  React Native 0.87.1
docs/METROPOLITANO_DESARROLLO.md                       Especificación extensa
docs/reference/metropolitano_perfil.html              Referencia original
docs/IMPLEMENTACION.md                                Estado y diferencias
```

### Integración experimental APF3

En una terminal inicia la API Python desde la raíz:

```powershell
.\.venv\Scripts\python.exe -m pip install -r apf3\requirements.txt
.\.venv\Scripts\python.exe -m apf3.experiment
.\.venv\Scripts\python.exe -m uvicorn apf3.api:app --host 127.0.0.1 --port 8001
```

En otra terminal inicia Spring y la web como se indica abajo. El planeador
conectado solicita A*, ETA Ridge y clasificación XGBoost al servicio Python;
permite elegir los escenarios sintéticos de hora punta/valle e incidencia. El
modelo Ridge usa entradas sintéticas y no calcula el ETA de la ruta A*. No se
debe interpretar como dato operativo. Ver [guía, pruebas, API y despliegue
opcional](apf3/README.md).

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

La API de Spring se configura en `src/api.ts` y usa `http://localhost:8080/api/v1/demo`; la API experimental APF3 usa `http://localhost:8001`. Para Android por USB, `android:usb` configura automáticamente los reenvíos de Metro, Spring (8080) y APF3 (8001). Después de reconectar el teléfono puede ser necesario repetirlos. Usar HTTP solo en desarrollo; una futura versión real necesitará HTTPS y autenticación propia. No hay conexión automática a un proveedor público.

Las fuentes ya están enlazadas. Para cambiar o volver a enlazar activos: `npx react-native-asset`. En iOS ejecutar la instalación de pods siguiendo el README móvil original y reconstruir en macOS; no se compiló iOS desde Windows.

### Rutas largas en Windows

Para un telefono Android por USB, la opcion recomendada es ejecutar desde la carpeta movil `npm run start:usb -- --port 8082` y, en otra terminal, `npm run android:usb -- --port 8082`. Estos comandos crean/verifican M: en la sesion del usuario. El segundo conecta el puerto USB y usa `--no-packager`, por lo que no intenta abrir un segundo Metro. `npm run check:usb` comprueba el alias sin instalar nada. Una unidad M: que pertenezca a otra carpeta no se modifica.

El comando `android:usb` regenera la configuración de autolinking si fue creada usando otra ruta, para evitar que Gradle mezcle `C:` y `M:`. El SDK de Android debe estar configurado con `ANDROID_HOME` en la terminal que ejecuta el comando.

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
| POST `/api/v1/demo/assistant` | `{message}` (1–1000 caracteres) → `{reply}`; requiere sesión conectada y clave Gemini |

### Asistente de IA (demo)

El backend usa el SDK oficial **Google Gen AI para Java 2.4.0** con el modelo `gemini-3.5-flash-lite`, compatible con Spring Boot y Java 21; `@google/genai` es la variante para JavaScript y no se instala en la aplicación móvil. Maven descarga el SDK declarado en `pom.xml` con:

```powershell
Set-Location C:\Metropolitano\itd-repository\backend\metropolitano-backend-api
.\mvnw.cmd -DskipTests package
```

Obtén una clave en Google AI Studio y asígnala únicamente en la terminal del servidor antes de iniciarlo:

```powershell
$env:GEMINI_API_KEY = 'TU_CLAVE'
.\mvnw.cmd spring-boot:run
```

No escribas ni compartas tu clave real en archivos, código, frontend o capturas. `.env.example` documenta el nombre; Spring no carga automáticamente ese archivo, por lo que hay que definir la variable de entorno. Para Android, inicia una sesión conectada y configura `adb reverse tcp:8080 tcp:8080` como se indica arriba.

El asistente se abre desde el botón flotante «IA» en la app móvil y la vista web; permite escribir o enviar una pregunta sugerida con un clic y ofrece accesos a Inicio, Rutas, Alertas y Cuenta. Los accesos los elige el usuario, no navegan automáticamente según la respuesta de IA. Sin conexión indica que necesita una sesión conectada para las preguntas. Cada pregunta es independiente y se envía a Google Gemini con el catálogo de estaciones, rutas y alertas **simuladas**, las reglas de recarga demo y el saldo y hasta cinco recargas ficticias de la sesión. No se envían automáticamente el perfil, DNI, celular ni correo del usuario; no incluyas datos personales ni de pago en las preguntas. Gemini puede equivocarse, y no hay información en vivo, pasarela de pago ni conexión oficial con ATU. La sesión de demostración no es autenticación de producción: no publiques esta API sin autenticación robusta, límites de uso y controles adicionales.

Google ofrece una capa gratuita sujeta a disponibilidad, cuota, región y condiciones; pueden aplicarse cargos si se habilita facturación. Consulta [precios de Gemini](https://ai.google.dev/gemini-api/docs/pricing) y condiciones antes de usarla. Sin clave, o si el proveedor falla, la aplicación mostrará un error en lugar de simular una respuesta.

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
