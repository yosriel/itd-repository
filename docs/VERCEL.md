# Publicar las APIs del APK y la web en Vercel

El teléfono consulta directamente los dominios HTTPS de Spring y APF3. Cada servicio puede escalar y volver a arrancar independientemente. Spring guarda cuentas, saldo, recargas y los hashes de sesión en una base MySQL compartida. APF3 empaqueta los modelos entrenados en la imagen. Una instancia nueva carga los modelos de la imagen y puede atender predicciones sin entrenar durante la petición.

## Crear los servicios

Crea un equipo o espacio personal y tres proyectos con el mismo repositorio. El tercero es necesario si también se distribuye la web. En cada proyecto selecciona la carpeta raíz indicada. Vercel detecta el Dockerfile de cada API. Su runtime de contenedores está en beta. [Documentación de Vercel](https://vercel.com/docs/functions/runtimes/container)

| Proyecto | Carpeta raíz | Configuración de producción |
|---|---|---|
| Spring | backend/metropolitano-backend-api | Preset Container, PORT=10000, SPRING_PROFILES_ACTIVE=demo,mysql. Configurar DB_URL, DB_USER y DB_PASSWORD como variables del servidor. |
| APF3 | apf3 | Preset Container, PORT=10000. El Dockerfile entrena con el CSV versionado y Python 3.13. |
| Web | frontend/metropolitano-mobile-app/MetropolitanoMobileApp | Vite, Node 24, npm ci, npm run build:web, salida build/web. |

Aprovisiona MySQL accesible por TLS con un usuario exclusivo sobre la base del proyecto y permisos para las migraciones Flyway. El ejemplo del backend usa `sslMode=VERIFY_IDENTITY`. Si el proveedor usa una CA privada, configura el truststore del cliente. La base en memoria o en el disco de un contenedor perdería los datos al escalar o reiniciar.

Configura `VITE_API_URL` con el dominio HTTPS de Spring seguido de `/api/v1/demo` y `VITE_AI_URL` con el origen HTTPS de APF3. En ambos backends configura `CORS_ALLOWED_ORIGINS` con los orígenes web autorizados, separados por comas. En Expo usa las mismas dos URLs con los nombres `EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_AI_URL`, y genera el APK después de definirlas. Configura `GEMINI_API_KEY` solo en Spring para usar el asistente. En el firewall del proyecto limita las peticiones a registro, sesiones, asistente y predicción según el presupuesto de uso. El perfil de presentación es compartido y admite únicamente datos ficticios.

## Integración y despliegue continuos

GitHub Actions ejecuta en paralelo Maven con Java 21, lint y pruebas de APF3, comprobaciones Expo/TypeScript/Jest, construye las imágenes de las APIs y adjunta el APK arm64 como artefacto de la ejecución. Configura las variables GitHub EXPO_PUBLIC_API_URL y EXPO_PUBLIC_AI_URL para que ese APK utilice los servidores públicos. El trabajo de producción depende de todos los trabajos de validación. Para activarlo, define las variables del repositorio `ENABLE_VERCEL_DEPLOY=true`, `VERCEL_ORG_ID`, `VERCEL_SPRING_PROJECT_ID`, `VERCEL_APF3_PROJECT_ID` y `VERCEL_WEB_PROJECT_ID`. Guarda `VERCEL_TOKEN` en los secretos del entorno GitHub `production`. El flujo publica el checkout de main con Vercel CLI. Al usar este flujo, desactiva los despliegues automáticos de la integración Git para evitar dos publicaciones independientes. Mantén las vistas previas separadas de la base de producción.

Después de publicar, verifica health en Spring y APF3. Abre el APK desde otra red, registra una cuenta ficticia, calcula una ruta, recarga, cierra sesión y comprueba el saldo tras volver a entrar. Para una reversión, restaura el despliegue anterior compatible con las migraciones de base ya aplicadas. Registra los dominios y el commit una vez validada la publicación. [Gestión de despliegues de Vercel](https://vercel.com/docs/deployments)
