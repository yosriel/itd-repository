# Sustentación del avance final 3

| Criterio | Qué mostrar | Resultado e interpretación |
|---|---|---|
| Cloud y DevOps | APK Expo → dos APIs HTTPS; imágenes independientes; MySQL compartido; workflow con pruebas previas al despliegue | La predicción puede replicarse separadamente de las escrituras transaccionales. El costo incluye el arranque de contenedores, memoria por réplica y conexiones a la base. |
| Fundamentos de IA y búsqueda | Estado = estación, acción = arista dirigida, costo = minutos sintéticos, objetivo = estación de destino. Comparar en apf3/search.py | Con incidencia de Naranjal a Central, BFS obtuvo 28 min, DFS 31, A* 19 y Hill Climbing 28. BFS prioriza saltos y DFS depende del orden. La heurística es el costo mínimo sin incidencia; la penalidad no negativa mantiene la admisibilidad. Hill Climbing puede detenerse en un mínimo local. |
| Regresión y clasificación | División estratificada con semilla 42, 4.000 filas de entrenamiento y 1.000 de prueba. Los transformadores se ajustan dentro del pipeline | ETA es continua. RMSE de la lineal 1,978 min frente a 1,983 de Ridge; el término polinómico de grado 2 apenas cambia el error. Ridge usa alpha 10 elegido con validación cruzada. La regresión logística produce probabilidad de saturación y alcanzó F1 0,834, recall 0,860. |
| SVM, KNN, árbol y boosting | Comparar en el mismo conjunto y con la misma definición de saturación | F1: SVM RBF 0,833, KNN con 7 vecinos 0,817, árbol de profundidad 6 0,825, Gradient Boosting 0,829 y XGBoost 0,819. XGBoost con 100 árboles de profundidad 3 logró AUC 0,944. La logística obtuvo AUC 0,946 y mayor recall en esta ejecución. |
| Sustentación y código | Ejecutar las pruebas, mostrar una ruta y comparar latencia y errores bajo carga | El ETA de Ridge y el costo de A* corresponden a cálculos distintos. El ensamble captura relaciones no lineales y cuesta más entrenarlo y servirlo. La logística es una referencia competitiva y más fácil de explicar. El experimento usa una sola partición sintética; hacen falta datos operativos y validación temporal para generalizar. |

El [resultado del entrenamiento](../apf3/resultados.json) incluye hiperparámetros, MAE, RMSE, R², precisión, recall, F1, AUC y matrices de confusión.

## Rendimiento local

El banco inicia Spring y APF3 en puertos de loopback con una base H2 desechable. Carga, estrés, picos y resistencia ejercitan 75 % de lecturas de estado y 25 % de predicciones. Se excluyen el arranque de los servicios y la latencia de red externa. El p95 indica el tiempo que cubre al 95 % de las solicitudes del tramo.

| Prueba | Carga aplicada | Resultado |
|---|---|---|
| Carga | 480 peticiones, 6 concurrentes | 368 peticiones/s, p95 de 42 ms, 0 errores |
| Estrés | 320 peticiones por nivel, 4 → 12 → 24 concurrentes | p95 de 45 → 139 → 240 ms, 0 errores. El mayor nivel completó 362 peticiones/s. |
| Picos | 160 peticiones por tramo, 2 → 24 → 2 concurrentes | p95 de 18 → 219 → 23 ms, 0 errores |
| Resistencia | 4.500 peticiones en 15 minutos, a 5 peticiones/s | 2 errores en el minuto 3. El p95 por minuto osciló entre 14 y 388 ms. La primera ejecución solo registró el conteo de errores. |
| Volumen | 1.000 recargas únicas, seguidas de 400 lecturas | 0 errores. El saldo aumentó S/ 5.000,00 y la API devolvió los últimos 50 movimientos. p95 de 28 ms en escritura y 25 ms en lectura. |
| Escalabilidad | 240 predicciones por configuración, 8 concurrentes y 1 → 2 procesos de APF3 | 125 → 216 peticiones/s (+72 %) y p95 de 86 → 59 ms. 0 errores. |

La ejecución completa registró 8.300 solicitudes y 2 errores (0,024 %). El estrés mostró aumento de latencia hasta el máximo evaluado de 24 solicitudes concurrentes. Son mediciones de una máquina local. La capacidad servida y la latencia de Vercel requieren su propia medición.

[Resultados por etapa y minuto](../performance/resultados.json) · [Código para reproducir las seis pruebas](../performance/run.py)

La repetición completa con un tramo de resistencia de 3 minutos hizo 4.700 solicitudes, incluidas 900 del tramo sostenido, y registró 0 errores. El mayor p95 por minuto fue 52 ms. La mejora en APF3 volvió a aparecer al aumentar de uno a dos procesos (87 → 153 peticiones/s). [Resultados de la repetición](../performance/repeticion-3-min.json)
