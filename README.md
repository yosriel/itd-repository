# Metropolitano Lima · APF3

Aplicación académica de Android desarrollada con Expo y React Native, con una vista web complementaria. Para entrar se requiere una sesión de Spring. Ambas interfaces leen el catálogo, el perfil, los movimientos y las alertas desde la API. El planeador consulta A*, Ridge y XGBoost en APF3. Los datos de transporte, el QR, los andenes y las recargas son simulados. La aplicación no realiza pagos ni consulta servicios de ATU.

## Requisitos

| Componente | Versión o requisito |
|---|---|
| Android | Expo SDK 58, React Native 0.88.1, React 19.3, teléfono arm64 para el APK local predeterminado |
| Desarrollo JS | Node 24.3+ de la rama 24 o Node 26, npm y package-lock.json |
| Spring | JDK 21, Spring Boot 4.1.1, Maven Wrapper 3.9.16 |
| Modelos | Python 3.13, dependencias fijadas en apf3/requirements.txt |
| Compilación Android | JDK 21, Android SDK, NDK y CMake. Expo genera Gradle y el proyecto Android. |
| Datos | H2 para la prueba local; MySQL persistente y compartido para las réplicas en Vercel |

## Arrancar ambas APIs

Desde la raíz del repositorio, configura `JAVA_HOME` con un JDK 21 y ejecuta en Bash:

```bash
export PATH="$JAVA_HOME/bin:$PATH"
(cd backend/metropolitano-backend-api && ./mvnw package)
python3.13 -m venv .venv
.venv/bin/python -m pip install -r apf3/requirements.txt
.venv/bin/python -m apf3.experiment
./scripts/servir-local.sh
```

El entrenamiento genera modelos confiables en `apf3/artifacts/` y actualiza el informe de métricas. Spring escucha en el puerto 8080 y APF3 en el 8001. Comprueba `/actuator/health` y `/health`, respectivamente. El perfil local usa H2 en la carpeta `data/` del backend. `GEMINI_API_KEY` es opcional para las demás funciones y se configura exclusivamente en Spring si se desea utilizar el asistente. Las contraseñas de las cuentas académicas se guardan con BCrypt.

## Abrir en Android con Expo

Activa la depuración USB, autoriza el equipo en el teléfono y conserva las APIs en ejecución. En otra terminal:

```bash
cd frontend/metropolitano-mobile-app/MetropolitanoMobileApp
npm ci
adb reverse tcp:8080 tcp:8080
adb reverse tcp:8001 tcp:8001
adb reverse tcp:8081 tcp:8081
npm start -- --localhost
```

Con Expo Go compatible con SDK 58, abre el proyecto Android desde Expo CLI. Para ejecutar una compilación nativa de desarrollo en un dispositivo conectado usa `npm run android`. El modo de presentación también abre una sesión en el servidor. Si una API está caída, la operación muestra el error.

## Crear e instalar el APK

Desde la misma carpeta móvil, con `JAVA_HOME` y `ANDROID_HOME` configurados:

```bash
npm run apk
adb install -r artifacts/metropolitano.apk
```

El APK local incluye JavaScript, recursos y fuentes. Funciona sin Metro. El artefacto de demostración usa la firma de desarrollo y la ABI arm64-v8a. Para otro conjunto de ABI define `ANDROID_ABIS` antes de compilar. El plugin de red permite HTTP únicamente a localhost para las dos APIs mediante USB. Repite los reenvíos ADB tras reconectar el teléfono.

Para usar el teléfono sin el cable, compila con `EXPO_PUBLIC_API_URL=https://<spring>/api/v1/demo` y `EXPO_PUBLIC_AI_URL=https://<apf3>` en el entorno o en `.env.local` de la carpeta móvil. Usa los dominios que te asigne Vercel. Estas variables son públicas. Con una cuenta Expo, `eas build -p android --profile preview` genera un APK de distribución interna. Configura las dos URLs en el entorno EAS `preview` antes de construir.

## Web y despliegue

Desde la carpeta móvil, `npm run web` abre el sitio en `http://localhost:5173` y reenvía las llamadas a ambas APIs. `npm run build:web` genera `build/web/`. En Vercel se publican Spring y APF3 como contenedores HTTP. La web opcional usa Vite y el APK se distribuye por separado. La preparación de los proyectos, variables, persistencia y CI/CD está en [la guía de Vercel](docs/VERCEL.md).

## Contratos y pruebas

| Operación | Ruta y datos |
|---|---|
| Crear cuenta | POST `/api/v1/demo/register` con fullName, phone, dni, email y password |
| Ingresar o presentar | POST `/api/v1/demo/sessions` con phone y password, o POST `/api/v1/demo/sessions/presentation` |
| Leer estado / salir | GET `/api/v1/demo/state`, DELETE `/api/v1/demo/sessions/current` con Bearer |
| Cuenta y alertas | PATCH `/api/v1/demo/me`, PATCH `/api/v1/demo/preferences`, POST `/api/v1/demo/alerts/read-all` |
| Recarga de prueba | POST `/api/v1/demo/recharges` con amount, method e Idempotency-Key |
| Planeador | POST `/predict` en APF3 con origen, destino y escenario. Esquema en `/docs` |
| Asistente | POST `/api/v1/demo/assistant` con Bearer y message. Devuelve 503 sin configuración |

```bash
(cd backend/metropolitano-backend-api && ./mvnw verify)
.venv/bin/python -m flake8 apf3 --max-line-length=88
.venv/bin/python -m pytest apf3/tests -q
(cd frontend/metropolitano-mobile-app/MetropolitanoMobileApp && npx expo install --check && npx tsc --noEmit && npx tsc -p web --noEmit && npm run lint && npm test -- --runInBand && npm run build:web)
.venv/bin/python performance/run.py --minutos 15
```

La guía de [sustentación de la rúbrica](docs/APF3_ENTREGA.md) reúne los cinco criterios. Las [mediciones de rendimiento](performance/resultados.json) se obtienen contra procesos locales y una base desechable. Las capturas de octubre en `docs/evidence/` corresponden a una versión anterior.
