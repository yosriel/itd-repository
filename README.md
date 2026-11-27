# MetroLima

Aplicación Android con Expo para consultar las rutas regulares A, B, C y D, planificar viajes, encontrar estaciones por ubicación y consultar destinos con el asistente. Incluye una vista web de Vite.

[Descargar el APK público](https://metrolimaapp-android.vercel.app/metrolimaapp.apk)

## Estructura

| Componente | Guía |
|---|---|
| Android y web | [Configurar y ejecutar el cliente](frontend/metropolitano-mobile-app/MetropolitanoMobileApp/README.md) |
| Spring Boot y Neon PostgreSQL | [Arrancar las APIs desde una copia limpia](backend/README.md#arrancar-ambas-apis) |
| Catálogo y planificación de rutas en Python | [Ejecutar FastAPI y entrenar los modelos de simulación](backend/metrolimaapp-rutas/README.md) |
| Distribución | [Construir el APK](backend/README.md#crear-e-instalar-el-apk) y [desplegar en Vercel](backend/docs/VERCEL.md) |

## Requisitos

- Node.js 24.3+ o 26 y npm para Expo SDK 58, React Native 0.88.1 y Vite.
- JDK 21 para Spring Boot 4.1.3 con el Maven Wrapper 3.9.16. Android usa el mismo JDK con Gradle 9.4.1, Android Gradle Plugin 9.2.1, SDK 37 y NDK 27.1.12297006. [Spring Boot](https://docs.spring.io/spring-boot/4.1/system-requirements.html) · [Gradle](https://docs.gradle.org/current/userguide/compatibility.html) · [Android Gradle Plugin](https://developer.android.com/build/releases/gradle-plugin)
- Python 3.13 para la API de rutas y una rama de Neon PostgreSQL para desarrollo de Spring.

Los ejemplos de variables viven junto a [Spring](backend/metropolitano-backend-api/.env.example), [FastAPI](backend/metrolimaapp-rutas/.env.example) y [Expo/Vite](frontend/metropolitano-mobile-app/MetropolitanoMobileApp/.env.example). Guarda las credenciales de Neon y la clave opcional del asistente en el entorno de Spring.

## Pruebas

La [guía de backend](backend/README.md#contratos-y-pruebas) incluye los comandos para Spring, FastAPI, Expo, web y rendimiento local. La [guía de Vercel](backend/docs/VERCEL.md) describe cómo comprobar la publicación.
