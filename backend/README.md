# Metropolitano de Lima App

Aplicación Android con Expo y React Native y una vista web complementaria. Para entrar se requiere una sesión de Spring. El planificador usa el catálogo de los servicios regulares de la ATU. La simulación separada de tiempos y afluencia usa A*, Ridge y XGBoost. Los horarios en vivo, pagos y recargas de tarjetas físicas están fuera del alcance actual.

## Requisitos

| Componente | Versión o requisito |
|---|---|
| Android | Expo SDK 58, React Native 0.88.1, React 19.3, teléfono arm64 para el APK local predeterminado |
| Desarrollo JS | Node 24.3+ de la rama 24 o Node 26, npm y package-lock.json |
| Spring | JDK 21, Spring Boot 4.1.3, Maven Wrapper 3.9.16 |
| Modelos | Python 3.13, dependencias fijadas en backend/metrolimaapp-rutas/requirements.txt |
| Compilación Android | JDK 21, Android SDK, NDK y CMake. Expo genera Gradle y el proyecto Android. |
| Datos | PostgreSQL de Neon para desarrollo y Vercel. H2 en memoria solo en pruebas aisladas |

## Arrancar ambas APIs

Desde la raíz del repositorio, configura `JAVA_HOME` con un JDK 21 y ejecuta en Bash:

```bash
export PATH="$JAVA_HOME/bin:$PATH"
# En la primera ejecución copia .env.example a .env en backend/metropolitano-backend-api.
# Completa .env con la conexión de tu rama Neon de desarrollo.
set -a
source backend/metropolitano-backend-api/.env
set +a
(cd backend/metropolitano-backend-api && ./mvnw package)
(cd backend/metrolimaapp-rutas && python3.13 -m venv .venv && .venv/bin/python -m pip install -r requirements.txt && .venv/bin/python -m rutas.experiment)
./backend/scripts/servir-local.sh
```

El entrenamiento genera modelos confiables en `backend/metrolimaapp-rutas/artifacts/` y actualiza el informe de métricas. Spring escucha en el puerto 8080 y la API de rutas en el 8001. Comprueba `/actuator/health` y `/health`, respectivamente. La API local también requiere Neon. Prepara el esquema en tu rama de desarrollo con las migraciones y los permisos descritos en [la guía de despliegue](docs/VERCEL.md). `GEMINI_API_KEY` se configura exclusivamente en Spring y habilita las consultas que requieren Gemini. Las cuentas nuevas usan Argon2id con sal individual y las cuentas con BCrypt actualizan el hash al ingresar correctamente.

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

Con Expo Go compatible con SDK 58, abre el proyecto Android desde Expo CLI. Para ejecutar una compilación nativa de desarrollo en un dispositivo conectado usa `npm run android`. Si una API está caída, la operación muestra el error.

## Crear e instalar el APK

Desde la misma carpeta móvil, con `JAVA_HOME` y `ANDROID_HOME` configurados:

```bash
npm run apk
adb install -r artifacts/metropolitano.apk
```

El APK local incluye JavaScript, recursos y fuentes. Funciona sin Metro. El artefacto de demostración usa la firma de desarrollo y la ABI arm64-v8a. Para otro conjunto de ABI define `ANDROID_ABIS` antes de compilar. El plugin de red permite HTTP únicamente a localhost para las dos APIs mediante USB. Repite los reenvíos ADB tras reconectar el teléfono.

Para usar el teléfono sin el cable, compila con `EXPO_PUBLIC_API_URL=https://<spring>/api/v1/demo` y `EXPO_PUBLIC_AI_URL=https://<api-de-rutas>` en el entorno o en `.env.local` de la carpeta móvil. Usa los dominios que te asigne Vercel. Estas variables son públicas. Con una cuenta Expo, `eas build -p android --profile preview` genera un APK de distribución interna. Configura las dos URLs en el entorno EAS `preview` antes de construir.

## Web y despliegue

Desde la carpeta móvil, `npm run web` abre el sitio en `http://localhost:5173` y reenvía las llamadas a ambas APIs. `npm run build:web` genera `build/web/`. En Vercel se publican Spring y la API de rutas como contenedores HTTP. La web opcional usa Vite y el APK se distribuye por separado. La preparación de los proyectos, variables, persistencia y CI/CD está en [la guía de Vercel](docs/VERCEL.md).

## Estado de los servicios publicados

```bash
./backend/scripts/watchdog.sh instalar
./backend/scripts/watchdog.sh estado
./backend/scripts/watchdog.sh logs
```

El temporizador consulta ambas APIs HTTPS cada cinco minutos desde la laptop y reintenta ante fallos transitorios. El sondeo despierta los contenedores de Vercel si están inactivos. El registro queda en el diario de systemd de usuario. El sondeo requiere que la laptop esté encendida, conectada y con la sesión de usuario activa. Usa `detener` para desactivar el temporizador.

El registro valida celular peruano de nueve dígitos, DNI de ocho dígitos y un correo de un proveedor admitido. Los nombres se normalizan sin perder acentos, el correo se convierte a minúsculas y el DNI conserva los ceros iniciales. La contraseña requiere al menos diez caracteres, una mayúscula y uno de los símbolos `@`, `#` o `.`. Los datos de la cuenta y la preferencia de avisos se guardan en Neon. La última posición se guarda en el teléfono.

## Planificador del Metropolitano

Rutas reúne 44 estaciones de los servicios regulares publicados por la ATU. Selecciona una letra para consultar las paradas de ese servicio. Con **Todos**, el planificador devuelve viajes directos si existen y, cuando hace falta cambiar de bus, identifica la estación de transbordo. Las fichas muestran los horarios publicados y el planificador describe el recorrido, sin medir llegadas en tiempo real.

| Servicio | Terminales | Paradas |
|---|---|---:|
| [Regular A](https://portal.atu.gob.pe/QR/Metropolitano/Servicios/RegularA.php) | Naranjal ↔ Estación Central por Emancipación | 16 |
| [Regular B](https://portal.atu.gob.pe/QR/Metropolitano/Servicios/RegularB.php) | Chimpu Ocllo ↔ Estación Central por Alfonso Ugarte | 21 |
| [Regular C](https://portal.atu.gob.pe/QR/Metropolitano/Servicios/RegularC.php) | Ramón Castilla ↔ Matellini | 24 |
| [Regular D](https://portal.atu.gob.pe/QR/Metropolitano/Servicios/RegularD.php) | Naranjal ↔ Estación Central por Alfonso Ugarte | 15 |

Las coordenadas de referencia provienen de la [tabla 39 de la UNI](https://repositorio.uni.edu.pe/handle/20.500.14076/22099) y de [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) para la ampliación norte. Los mapas oficiales se consultaron el 26 de noviembre de 2026. La opción **Simular tiempos y afluencia** conserva el modelo sintético de ocho estaciones y su contrato anterior.

## Consultar destinos en el asistente

Puedes escribir «Quiero irme a Las Malvinas», «¿Cómo llego a Plaza Norte?» o «¿Dónde me bajo para ir al Puente de los Suspiros?». El asistente identifica el destino por sus nombres conocidos y devuelve una estación de referencia. Las consultas del catálogo se responden en Spring sin llamar a un proveedor externo.

El asistente reconoce las estaciones de los cuatro servicios y preguntas como «¿Qué paradas tiene la Ruta A?». Remite a la ficha de la ATU para confirmar los horarios.

- Plaza Norte y Tomás Valle. [Referencia de la ATU](https://www.gob.pe/institucion/atu/noticias/505937-atu-conoce-las-rutas-del-metropolitano-y-corredores-complementarios-que-te-acercan-a-los-vacunatorios-del-minsa-y-essalud)
- Alameda Las Malvinas y Dos de Mayo como referencia. La alameda ocupa varias cuadras y la estación conveniente depende del punto de llegada. [SERPAR](https://www.serpar.gob.pe/parques-metropolitanos/parque-alameda-las-malvinas/) · [Mapa troncal de ATU publicado por el MEF](https://www.mef.gob.pe/contenidos/inv_privada/app/IMIAPP_ATU_2023.pdf)
- Parque Kennedy y Ricardo Palma. [Municipalidad de Miraflores](https://www.miraflores.gob.pe/wp-content/uploads/convocatorias/adjudicacion-021-2019/Parque-Kennedy-expediente/Folios-801-a-869.pdf)
- Puente de los Suspiros, Parque Municipal de Barranco y Bulevar. [PromPerú](https://www.peru.travel/attractions/puente-de-los-suspiros-bridge-of-sighs) · [Municipalidad de Barranco](https://www.gob.pe/institucion/munibarranco/informes-publicaciones/6944780-barran)

## Contratos y pruebas

| Operación | Ruta y datos |
|---|---|
| Crear cuenta | POST `/api/v1/demo/register` con firstName, lastName, phone, dni, email y password |
| Ingresar | POST `/api/v1/demo/sessions` con phone y password |
| Leer estado / salir | GET `/api/v1/demo/state`, DELETE `/api/v1/demo/sessions/current` con Bearer |
| Cuenta y alertas | PATCH `/api/v1/demo/me`, PATCH `/api/v1/demo/preferences`, POST `/api/v1/demo/alerts/read-all` |
| Recarga de prueba | POST `/api/v1/demo/recharges` con amount, method e Idempotency-Key |
| Planificador | GET `/regular/catalog` y POST `/regular/plan` con origin, destination y service opcional. |
| Simulación | POST `/predict` con origen, destino y escenario. Esquema en `/docs`. |
| Asistente | POST `/api/v1/demo/assistant` con Bearer y message. Reconoce destinos del catálogo local. Las demás consultas requieren la configuración de Gemini |

```bash
(cd backend/metropolitano-backend-api && ./mvnw verify)
(cd backend/metrolimaapp-rutas && .venv/bin/python -m flake8 rutas tests --max-line-length=88)
(cd backend/metrolimaapp-rutas && .venv/bin/python -m pytest tests -q)
(cd frontend/metropolitano-mobile-app/MetropolitanoMobileApp && npx expo install --check && npx tsc --noEmit && npx tsc -p web --noEmit && npm run lint && npm test -- --runInBand && npm run build:web)
backend/metrolimaapp-rutas/.venv/bin/python backend/performance/run.py --minutos 15
```

La guía de [sustentación de la rúbrica](docs/APF3_ENTREGA.md) reúne los cinco criterios. El [ejecutor de rendimiento](performance/run.py) usa procesos locales y una base desechable. Mide carga, estrés, picos, resistencia, volumen, escalabilidad local, planificación regular e inicio y cierre de sesión. Las [mediciones conservadas](performance/resultados.json) y las [capturas del frontend](../frontend/docs/evidence/) corresponden a versiones anteriores.
