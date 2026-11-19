# Publicar Metropolitano en Render

Render puede servir la interfaz como Static Site gratis y las APIs como dos
servicios web gratuitos. El sitio estático no duerme. Los servicios gratuitos
de API sí pueden apagarse tras 15 minutos sin tráfico y tardar alrededor de un
minuto en responder a la siguiente petición. No se configura tráfico periódico
para evitar esa limitación: además de no ser una garantía de disponibilidad,
consume las horas gratuitas del espacio de trabajo.

## 1. Crear el frontend para obtener su URL

En Render crea primero un Static Site desde el repositorio Git conectado. Usa
la misma rama en los tres servicios. Deja `VITE_API_URL` y `VITE_AI_URL` sin
configurar durante esta primera publicación; el build usa las rutas locales
predeterminadas. Copia el origen asignado al sitio, por ejemplo
`https://mi-app.onrender.com`.

### Frontend web

- Tipo: **Static Site**.
- Root Directory: `frontend/metropolitano-mobile-app/MetropolitanoMobileApp`
- Build Command: `npm ci && npm run build:web`
- Publish Directory: `build/web`

## 2. Crear las APIs

Al crear cada API, configura `CORS_ALLOWED_ORIGINS` con el origen exacto del
Static Site que copiaste, incluyendo `https://` y sin una barra final.

### API Spring

- Tipo: **Web Service**, runtime **Docker**, plan **Free**.
- Root Directory: `backend/metropolitano-backend-api`
- Dockerfile Path: `./Dockerfile`
- Health Check Path: `/actuator/health`
- Variables:
  - `SPRING_PROFILES_ACTIVE` = `demo`
  - `DEMO_DB_URL` = `jdbc:h2:mem:metropolitano-demo;DB_CLOSE_DELAY=-1`
  - `CORS_ALLOWED_ORIGINS` = origen exacto del Static Site.
  - `GEMINI_API_KEY` = clave de Gemini configurada como secreto en el entorno de Render.

La clave de Gemini pertenece únicamente al servicio Spring. Créala en Google AI
Studio y guárdala en Render como variable secreta; no la pongas en `VITE_*`, en
el código del frontend ni en el repositorio. Sin esta variable, el asistente
responde `503` con el mensaje de que no está configurado. Después de guardarla,
vuelve a desplegar Spring y prueba el asistente con una sesión conectada.

La base H2 en memoria se reinicia cuando el servicio se reinicia o duerme; no
uses esta configuración para guardar datos que deban conservarse.

### API APF3

- Tipo: **Web Service**, runtime **Docker**, plan **Free**.
- Root Directory: la raíz del repositorio (dejar vacío).
- Dockerfile Path: `./apf3/Dockerfile`
- Health Check Path: `/health`
- Variable:
  - `CORS_ALLOWED_ORIGINS` = el mismo origen exacto del Static Site.

La imagen entrena los modelos sintéticos durante el build. El primer build puede
tardar bastante.

## 3. Conectar el frontend con las APIs

- En las variables de entorno de build del Static Site agrega:
  - `VITE_API_URL` = `https://<host-spring>/api/v1/demo`
  - `VITE_AI_URL` = `https://<host-apf3>`

Reemplaza cada host por el asignado por Render, incluyendo `https://` y sin una
barra final. Guarda los cambios y vuelve a desplegar el Static Site.

## 2. Verificar

Abre estos endpoints en el navegador; deben responder con estado saludable:

- `https://<host-spring>/actuator/health`
- `https://<host-apf3>/health`

Luego abre el Static Site, inicia sesión con los datos de presentación y prueba
una ruta en modo conectado. La primera llamada a cada API puede tardar debido al
arranque en frío. Si el navegador muestra un error CORS, confirma que
`CORS_ALLOWED_ORIGINS` en ambas APIs coincide exactamente con el origen del
frontend (protocolo y dominio).

Los cambios deben estar en la rama Git conectada a Render para que Render pueda
construirlos. No publiques credenciales ni claves API en el repositorio. Usa
solo datos de presentación; no hay pagos reales y el almacenamiento H2 no es
persistente en el plan gratuito.
