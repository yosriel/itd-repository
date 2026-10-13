# Validación del MVP académico

Fecha: 12 de octubre de 2026.

## Alcance de este incremento

- Selector de origen y destino, intercambio y búsqueda entre estaciones del catálogo del HTML.
- Grafo bidireccional de prueba construido a partir de las secuencias de paradas originales. Los tiempos totales originales se reparten uniformemente entre segmentos; se busca el recorrido de menor duración estimada. No considera tráfico, frecuencias, horarios, dirección operativa ni tiempo de transbordo. Los cambios de etiqueta de servicio cuentan como transbordos. No es un motor oficial de rutas.
- Tablero accesible tocando una estación de Inicio, con servicios del catálogo, andenes explícitamente ficticios y temporizadores que se reinician en ciclos. No utiliza telemetría.
- QR de demostración en Cuenta, renovación cada 30 segundos y lectura simulada sin cobro. No sustituye tarjeta física, no autentica al portador, no es de un solo uso seguro y no se acepta en torniquetes.
- Base adaptable: ancho máximo 480 dp, modales limitados y contenido desplazable. La equivalencia visual en distintos dispositivos requiere las comprobaciones siguientes.

## Prueba moderada con participantes — pendiente de ejecutar

Reclutar al menos cinco participantes del público objetivo. Explicar que se trata de un prototipo con datos y pagos simulados. No solicitar DNI, celular ni información bancaria reales. Usar cuentas ficticias.

| Tarea | Criterio de aceptación | Qué registrar |
|---|---|---|
| Ingresar y encontrar una estación | Completa sin ayuda y entiende que es demo | Tiempo, errores, comentarios |
| Abrir próximos buses | Identifica servicio, andén de prueba y cuenta regresiva | Comprensión y éxito |
| Elegir origen y destino e intercambiarlos | El recorrido empieza y termina donde seleccionó | Tiempo y errores |
| Seleccionar la misma estación en ambos campos | Comprende el mensaje; no aparece ruta incorrecta | Recuperación |
| Ver QR y simular su lectura | Reconoce que no sirve para viajar; saldo sin cambios | Comprensión |
| Recargar S/ 5 de prueba | Saldo aumenta una vez y aparece en historial | Saldo antes/después |
| Editar perfil | Cambia nombre en Perfil e Inicio | Persistencia al reingresar conectado |

Objetivo del ciclo: al menos 4 de 5 participantes completan cada tarea sin intervención y todos identifican pagos/ETA/QR como simulados. Es una meta propuesta, no un resultado obtenido. Registrar tiempos individuales antes de estimar promedios. No afirmar reducción de colas reales con pruebas de interfaz.

## Matriz de dispositivos — pendiente de revisión visual

Revisar anchos de 320, 360, 412 y 768 dp; orientación vertical/horizontal; texto del sistema normal y aumentado; teclado abierto; navegación por gestos y botones. En todos: controles accesibles, texto sin superposición, selector y modales desplazables, logo íntegro, botón final fuera de barras del sistema. Con texto aumentado se permite desplazamiento adicional, sin esconder información.

## Evidencia y resultados

Las pruebas automatizadas verifican recorridos de todos los pares del catálogo, extremos, duración positiva y entradas inválidas. Esto valida la lógica del prototipo, no la exactitud del transporte real.

No se han realizado aún sesiones moderadas ni una matriz completa de dispositivos. Registrar posteriormente participantes anónimos, dispositivo, tareas, resultados, hallazgos y decisiones del siguiente ciclo. No inventar resultados para el informe.
