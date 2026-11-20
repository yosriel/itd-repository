# Publicar las APIs del APK y la web en Vercel

El teléfono consulta directamente los dominios HTTPS de Spring y de la API de rutas. Cada servicio puede escalar y volver a arrancar independientemente. Spring guarda cuentas, saldo, recargas y los hashes de sesión en PostgreSQL. La API de rutas empaqueta los modelos entrenados en la imagen para atender predicciones después de cada arranque.

## Demo Android desplegada

Metropolitano de Lima App usa [MetroLimaApp](https://metrolimaapp.vercel.app/health) para las rutas y [MetroLimaApp API](https://metrolimaapp-api.vercel.app/actuator/health) para las cuentas. Spring usa el recurso gratuito `metrolimaapp-db` de Neon en São Paulo. Las reglas de Vercel limitan por IP las operaciones POST de la demo a 30 y las predicciones a 40 por minuto.

Desde la carpeta móvil, con JDK 21, Android SDK y las dependencias instaladas con `npm ci`, genera un APK que usa las dos APIs públicas:

```bash
EXPO_PUBLIC_API_URL=https://metrolimaapp-api.vercel.app/api/v1/demo \
EXPO_PUBLIC_AI_URL=https://metrolimaapp.vercel.app \
ANDROID_ABIS=arm64-v8a,x86_64 npm run apk
```

El resultado queda en `artifacts/metropolitano.apk` y usa la firma de desarrollo de la entrega académica.

## Crear los servicios

Crea un equipo o espacio personal y tres proyectos con el mismo repositorio. El tercero es necesario si también se distribuye la web. Para el despliegue por CLI, usa como directorio de trabajo la carpeta indicada y configura la raíz del proyecto de Vercel como `.`. Vercel detecta el Dockerfile de cada API. Su runtime de contenedores está en beta. [Documentación de Vercel](https://vercel.com/docs/functions/runtimes/container)

| Proyecto | Carpeta raíz | Configuración de producción |
|---|---|---|
| MetroLimaApp API | backend/metropolitano-backend-api | Preset Container, PORT=10000, SPRING_PROFILES_ACTIVE=demo,postgres. Configurar POSTGRES_DB_URL, POSTGRES_DB_USER y POSTGRES_DB_PASSWORD como secretos del servidor. |
| MetroLimaApp | backend/metrolimaapp-rutas | Preset Container, PORT=10000. El Dockerfile entrena con el CSV versionado y Python 3.13. |
| Web | frontend/metropolitano-mobile-app/MetropolitanoMobileApp | Vite, Node 24, npm ci, npm run build:web, salida build/web. |

Aprovisiona PostgreSQL desde la integración de Neon en Vercel. Usa la conexión directa para las migraciones y la conexión agrupada para la aplicación. Las dos URLs JDBC deben usar `sslmode=verify-full` y `sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory`. Las credenciales administrativas se obtienen de la integración con acceso autorizado al proyecto. En este despliegue, la integración se conectó al entorno Development para mantenerlas fuera del contenedor de producción.

Aplica las migraciones antes de publicar Spring. Inicia el JAR con el perfil `demo,postgres`, `SPRING_FLYWAY_ENABLED=true`, la URL JDBC directa y las credenciales de migración como variables de entorno. Escucha solo en localhost y espera que `/actuator/health` devuelva `UP`. Configura Spring en Vercel con `SPRING_FLYWAY_ENABLED=false` y un usuario de ejecución con `CONNECT` a la base, `USAGE` en el esquema y permisos `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre `demo_account`, `demo_recharge`, `demo_session` y `demo_session_guard`. Guarda la conexión agrupada y las credenciales de ese usuario en `POSTGRES_DB_URL`, `POSTGRES_DB_USER` y `POSTGRES_DB_PASSWORD`. Repite el procedimiento antes de desplegar una versión que cambie el esquema o sus tablas.

Para publicar manualmente desde un checkout limpio, ejecuta `vercel deploy --prod --project metrolimaapp-api --regions gru1` desde la carpeta de Spring. Para la API de rutas, ejecuta `vercel deploy --prod --project metrolimaapp` desde `backend/metrolimaapp-rutas/`. Ambos proyectos usan el preset Container.

Configura `VITE_API_URL` con el dominio HTTPS de Spring seguido de `/api/v1/demo` y `VITE_AI_URL` con el origen HTTPS de la API de rutas. En ambos backends configura `CORS_ALLOWED_ORIGINS` con los orígenes web autorizados, separados por comas. En Expo usa las mismas dos URLs con los nombres `EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_AI_URL`, y genera el APK después de definirlas. Configura `GEMINI_API_KEY` solo en Spring para usar el asistente. El perfil de presentación es compartido y admite únicamente datos ficticios.

## Integración y despliegue continuos

GitHub Actions ejecuta en paralelo Maven con Java 21, lint y pruebas de rutas, comprobaciones Expo/TypeScript/Jest, construye las imágenes de las APIs y adjunta el APK arm64 como artefacto de la ejecución. Configura las variables GitHub EXPO_PUBLIC_API_URL y EXPO_PUBLIC_AI_URL para que ese APK utilice los servidores públicos. El trabajo de producción depende de todos los trabajos de validación. Para activarlo, define las variables del repositorio `ENABLE_VERCEL_DEPLOY=true`, `VERCEL_ORG_ID`, `VERCEL_SPRING_PROJECT_ID`, `VERCEL_APF3_PROJECT_ID` y `VERCEL_WEB_PROJECT_ID`. Guarda `VERCEL_TOKEN` en los secretos del entorno GitHub `production`. El flujo publica el checkout de main con Vercel CLI. Al usar este flujo, desactiva los despliegues automáticos de la integración Git para evitar dos publicaciones independientes. Mantén las vistas previas separadas de la base de producción.

Después de publicar, verifica los endpoints de estado de ambas APIs. Abre el APK desde otra red, registra una cuenta ficticia, calcula una ruta, recarga, cierra sesión y comprueba el saldo tras volver a entrar. Para una reversión, restaura el despliegue anterior compatible con las migraciones de base ya aplicadas. Registra los dominios y el commit una vez validada la publicación. [Gestión de despliegues de Vercel](https://vercel.com/docs/deployments)
