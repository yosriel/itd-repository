# Resultados de validación del MVP

Fecha: 12/10/2026. Pruebas técnicas realizadas por el agente sobre una demostración académica. No constituyen un estudio con usuarios ni certificación operativa.

## Entrega

Aplicación móvil React Native y vista web complementaria que comparte estado, catálogo, cálculo de rutas y conexión a Spring. La web permite revisar el MVP desde http://127.0.0.1:5173/ mientras el servidor está iniciado. Su renderizado DOM es independiente del renderizado nativo.

## Resultados comprobados

- Acceso conectado a Spring con una cuenta ficticia de prueba.
- Recarga simulada de S/ 5: saldo S/ 12.50 → S/ 17.50 y movimiento en historial. Cierre de sesión y nuevo acceso conservan saldo y movimiento.
- Acceso sin conexión, edición del perfil y actualización del nombre en Inicio y Cuenta.
- Selección de origen/destino, búsqueda y detalle: Naranjal → Estación Central muestra estimación demo de 15 minutos. No es una verificación del servicio real.
- QR generado y lectura simulada sin alterar el saldo.
- Tablero de estación, temporizadores y catálogo de servicios de ejemplo.
- Fotografías y logotipos locales del HTML; no dependen de descargar imágenes al abrir la pantalla.
- Once pruebas frontend en cinco suites aprobadas; comprobación TypeScript móvil y web aprobada.
- Siete pruebas backend aprobadas tras una compilación limpia; compilación de la web aprobada.

## Adaptación verificada en navegador

| Vista en píxeles CSS | Desbordamiento horizontal | Navegación visible | Ancho máximo del contenido |
|---|---|---|---|
| 320 × 568 | No | Sí | 320 |
| 360 × 800 | No | Sí | 360 |
| 412 × 915 | No | Sí | 412 |
| 768 × 1024 | No | Sí | 480 |
| 800 × 360 | No | Sí | 480 |

Se corrigió la compresión vertical de tarjetas y el salto del encabezado en la web estrecha. Estos resultados verifican el navegador; las capturas web no prueban la representación en Android o iOS. La aplicación nativa conserva ancho limitado y contenido desplazable, pero requiere una nueva comprobación visual en dispositivos físicos después de cada cambio relevante.

## Capturas para subir

Los PNG numerados en `evidence/` se tomaron directamente del navegador con vista 412 × 915. Son evidencias reales de la versión web, no maquetas ni capturas de teléfono físico. Los datos de perfil, tarjeta y recargas son ficticios.

1. Inicio.
2. Planeador y resultado de ruta.
3. Detalle del recorrido.
4. Alertas de ejemplo.
5. Cuenta con recarga persistida.
6. QR de demostración.
7. Opciones de recarga.
8. Perfil editable.
9. Tablero de próximos buses.

## Límites del alcance

GPS, buses, andenes, tiempos, QR para torniquetes, pagos Yape/bancarios y push siguen siendo simulados. No existe integración oficial ATU. El acceso demo no verifica identidad. La prueba moderada con participantes sigue pendiente: no se inventaron entrevistas, métricas SUS ni resultados humanos. El protocolo editable está en VALIDACION_MVP.md.
