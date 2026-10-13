# Estado de la primera implementación

Fecha: 12 de octubre de 2026. Base: HTML final con SHA-256 `734BCBFA25EC1F318DB668188AE22BE6319240750AC5F63D36CD6D7A700B6F27`.

## Implementado

| Requisito | Ubicación | Alcance real |
|---|---|---|
| NativeWind / Tailwind 3 | Configuración móvil, `global.css`, `src/ui.tsx` | Estilos nativos; no WebView |
| Lucide | `src/icons.ts` | Importación de módulos públicos individuales |
| Fuentes originales | `assets/fonts`, Android/iOS | Manrope y Fraunces con OFL |
| Navegación | `App.tsx`, `navigationTypes.ts` | Tabs y stacks con regreso por sistema |
| Ocho pantallas | `src/screens` | Contenido del HTML y páginas informativas añadidas |
| Perfil | `Account.tsx`, `AppProvider.tsx`, `DemoService` | Validación, persistencia conectada, nombre común y cancelación |
| Demo sin conexión | `AppProvider.tsx` | Estado en memoria separado |
| Búsqueda y rutas | `HomeAlerts.tsx`, `Routes.tsx` | Ocho estaciones y doce rutas de fixtures |
| Modal ubicación | `HomeAlerts.tsx` | Ejemplo; no permiso ni GPS real |
| Viaje | `Routes.tsx` | Animación cancelable, limpieza al salir |
| Alertas | `HomeAlerts.tsx`, backend | Ejemplos fijos, lectura global y preferencia persistente |
| Saldo e historial | `Account.tsx`, JPA | Saldo demo, últimos 50 registros de recarga y ejemplos iniciales |
| Recarga idempotente | `DemoService`, `RechargeRepository` | Dinero ficticio, BigDecimal, bloqueo pesimista y clave única |
| Sesiones | `DemoSessions` | Bearer aleatorio en memoria, vencimiento 1 h, revocación |
| Migraciones | `db/migration` | H2 local; perfil MySQL conservado |
| Errores de API | `DemoErrors` | ProblemDetail y validación por campo |

## Diferencias deliberadas respecto del HTML

- Se identifican los datos simulados en todas las pantallas autenticadas y al ingresar.
- No se reproduce el marco negro/notch de exposición en la app.
- El formulario valida formato y guarda en servidor en modo conectado. Cancelar descarta borrador y el nombre cambia también en Inicio.
- Los métodos de pago y otros menús ya abren explicaciones propias; no aparentan gestionar una contraseña o cuenta bancaria inexistente.
- La solicitud de ubicación explica que es una simulación y no accede al dispositivo.
- Las imágenes remotas conservan sus referencias y tienen fallback neutro; no se verificó visualmente su disponibilidad ni licencias individuales.
- Se mantiene el origen fijo Naranjal y el catálogo de rutas de demostración. El selector utiliza un modal nativo.
- La versión inicial utiliza MySQL como alternativa a H2; no se reemplazó la dependencia por PostgreSQL, que era una propuesta del documento.
- La API inicial se agrupa en `/api/v1/demo` para probar el flujo; aún no es el conjunto completo de contratos modulares propuestos.

## Pendientes antes de considerar el producto completo

1. Revisar las ocho vistas renderizadas contra el HTML y ensayar en un Android real/emulador y en iOS. No hubo dispositivo conectado ni AVD disponible durante esta entrega.
2. Verificar imágenes, posibles referencias al Corredor Rojo, autores y licencias individuales.
3. Autenticación propia de producción y estrategia de DNI/celular. El login demo identifica por celular original, acepta DNI ficticio y no verifica titularidad.
4. Sesión persistente con almacenamiento seguro y recuperación ante vencimiento; actualmente el token vive en memoria y el usuario vuelve a ingresar.
5. Lectura individual de alertas, catálogo versionado/verificado, mapa/geolocalización y proveedor push si se requieren. No están disponibles por defecto.
6. Libro mayor completo, saldo de apertura explícito, conciliación y paginación de historial. Los tres registros precargados son ilustraciones, sin efecto sobre el balance persistido.
7. Edición concurrente con recuperación de conflictos en UI; el servidor ya detecta versión antigua pero el cliente muestra error y requiere volver a ingresar para refrescar tras cambios de otra sesión.
8. Persistir la clave de una recarga con resultado incierto entre reinicios. Actualmente se conserva al cerrar y abrir el sheet dentro de la sesión, pero se pierde al terminar la app.
9. Revisar avisos de dependencias antes de producción. No se aplicaron downgrades ni actualizaciones mayores forzadas sugeridas por la auditoría.
10. Documentar y validar MySQL con pruebas propias; H2 no prueba diferencias de dialecto ni aislamiento en MySQL.

## Evidencia de verificación

Resultados ejecutados en esta entrega:

| Comprobación | Resultado |
|---|---|
| TypeScript `tsc --noEmit` | Sin errores |
| ESLint | Sin errores ni warnings |
| Jest móvil | 3 suites, 7 pruebas aprobadas |
| Maven package / JUnit | 7 pruebas aprobadas; JAR generado |
| Perfil no demo | Login demo y documentación denegados; health disponible |
| Bundle Android de Metro | Generado con NativeWind y 19 recursos |
| Gradle `assembleDebug`, arm64-v8a | BUILD SUCCESSFUL usando alias M: |
| HTTP real contra JAR local | Health UP; OpenAPI 3.1.0; perfil guardado |
| Recarga HTTP repetida | Un registro, saldo 22.50, mismo ID al reintentar |
| Logout HTTP | Token revocado, consulta posterior responde 401 |
| Auditoría npm tras correcciones compatibles | 65 avisos: 12 moderados, 53 altos, 0 críticos; requieren revisión |
| MySQL / iOS / dispositivo | No ensayados |

APK debug generado en `frontend/metropolitano-mobile-app/MetropolitanoMobileApp/android/app/build/outputs/apk/debug/app-debug.apk`. Requiere Metro; no es una distribución firmada ni un APK autónomo de publicación. Solo se compiló la ABI arm64-v8a.

Las pruebas HTTP se ejecutaron con una base en memoria y un servidor temporal en 127.0.0.1:18080, que se detuvo al terminar. El alias M: queda disponible para reconstruir sin el problema de rutas largas. Los logs son locales e ignorados por Git. El backend y la app móvil están en repositorios Git diferentes según la estructura original; no se hicieron commits.
