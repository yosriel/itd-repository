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

## Revisión de criterios del APF 3

| Criterio | Implementado en el proyecto | Pendiente para fortalecer la entrega |
|---|---|---|
| 1. Cloud y DevOps | `.github/workflows/ci-cd.yml` ejecuta lint, pruebas y construcción de la imagen APF3; `apf3/Dockerfile` y `.env.example` preparan el microservicio. | Construir y ejecutar la imagen en un entorno con Docker; configurar y probar AWS/ECS, secretos OIDC, monitoreo y rollback. El despliegue no está activo ni verificado. |
| 2. Búsqueda y enrutamiento | `apf3/search.py` implementa BFS, DFS, A* y Hill Climbing sobre el grafo; incluye penalización de incidencias y comparación de métricas. | Contrastar grafo, tiempos y penalizaciones con fuentes oficiales autorizadas; documentar cuándo los algoritmos no garantizan la ruta óptima y validar casos límite. |
| 3. Regresión y clasificación | `apf3/data_pipeline.py` genera el conjunto reproducible de 5.000 filas; `apf3/experiment.py` implementa los modelos de ETA y saturación solicitados con métricas y partición de datos. | Sustituir o contrastar los datos sintéticos con datos operativos autorizados y anonimizados; repetir la evaluación con validación cruzada y reportar resultados reproducibles, sin presentar predicciones como tiempos reales. |
| 4. Modelos y ensambles | `apf3/experiment.py` evalúa SVM, KNN, árbol, Gradient Boosting y XGBoost, con métricas comparativas e importancia de variables cuando el modelo la ofrece. | Analizar errores, desbalance y variabilidad entre particiones; justificar la selección por resultados observados. No afirmar que XGBoost supera siempre a los modelos individuales. |
| 5. Calidad, API, pruebas y accesibilidad | `apf3/api.py`, `apf3/main.py` y `apf3/tests/test_pipeline.py` cubren el servicio, el flujo de ejemplo y pruebas; la interfaz web/móvil consume la API de predicción. | Ejecutar las verificaciones vigentes antes de entregar; hacer revisión manual de teclado/lector de pantalla y contraste para WCAG 2.1 AA y Ley N.° 29973, y probar la integración en dispositivos. No se afirma certificación formal. |

### Lista priorizada de mejoras

1. **Datos y validez del modelo:** conseguir datos autorizados y anonimizados, documentar su procedencia y periodo, comparar el rendimiento contra una línea base y volver a entrenar/evaluar. Hasta entonces, los datos y resultados de APF3 son sintéticos y académicos.
2. **Infraestructura:** construir y probar el contenedor; después, preparar una cuenta AWS de prueba con límites de gasto, IAM mínimo, secretos fuera del repositorio, health checks y procedimiento de reversión. No desplegar a producción sin autorización.
3. **Accesibilidad:** revisar todas las pantallas con teclado, lector de pantalla y medición de contraste; corregir los hallazgos y guardar evidencia de la evaluación.
4. **Integración y dispositivos:** verificar de extremo a extremo los estados de API no disponible, errores y carga, y probar la aplicación en Android/iOS objetivo.
5. **Sustentación:** incluir resultados, limitaciones, decisiones de diseño y evidencia de pruebas; la nota final depende de la evaluación académica y no se puede garantizar solo con código.

### Análisis de resultados para la sustentación

Los valores de [resultados.json](../apf3/resultados.json) corresponden a una partición 80/20 (4.000/1.000 filas) de datos generados artificialmente con semilla 42. No son una estimación de rendimiento en estaciones reales.

- **ETA:** la regresión lineal obtuvo R² 0,957 y RMSE 1,978; los modelos polinómico, Lasso y Ridge quedaron cerca (R² 0,956). En este conjunto sintético la complejidad adicional no mejoró la métrica de la regresión lineal. La selección de un modelo más complejo debe justificarse con nuevos datos y validación.
- **Saturación:** XGBoost obtuvo accuracy 0,881, F1 0,832 y AUC 0,945; SVM tuvo la accuracy más alta (0,882) y la regresión logística la AUC más alta (0,946). Por ello no se concluye que XGBoost sea superior en general. La elección depende del costo relativo de falsos positivos/falsos negativos, la latencia y la métrica priorizada; en el caso medido, XGBoost no domina todas las métricas.
- **Búsqueda:** en el escenario de ejemplo, A* eligió una ruta de 19 min en el grafo y evitó Caquetá con la penalización activa. BFS y DFS sirven como comparación no informada (BFS prioriza cantidad de aristas y DFS depende del orden); Hill Climbing puede quedarse en un óptimo local. Estos minutos y tiempos de ejecución pertenecen exclusivamente al grafo inventado.
- **Cloud/DevOps:** el workflow prueba lint, pruebas y construcción de imagen. El paso de ECS se ejecuta solo tras configurar cuenta, permisos y variables; no se ha ejecutado ni verifica por sí solo observabilidad, rollback o funcionamiento en producción.

En la exposición, presentar estas limitaciones y explicar los trade-offs es parte de sustentar el trabajo: las métricas altas sobre datos sintéticos no prueban generalización a operaciones reales.
