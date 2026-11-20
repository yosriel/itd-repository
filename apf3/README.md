# MetroLimaApp · Experimentos de rutas

Este módulo Python es un microservicio experimental separado del backend
Java/Spring. El planeador web/móvil lo consulta al elegir una ruta en sesión
conectada; el Vite proxy y el reenvío USB usan el puerto 8001. Toda búsqueda del planeador usa la API. No alimenta las alertas ni las transacciones.
Gemini es otra función y no sustituye estos experimentos.
Todo el corredor, los tiempos y el dataset son **sintéticos**; no hay conexión
con ATU, GPS, pagos ni datos reales. No usar para decisiones operativas.

## Ejecutar en Windows desde la raíz del repositorio

Se requiere Python 3.13. En PowerShell:

```powershell
.\.venv\Scripts\python.exe -m pip install -r apf3\requirements.txt
.\.venv\Scripts\python.exe -m apf3.experiment
.\.venv\Scripts\python.exe -m apf3.main
.\.venv\Scripts\python.exe -m pytest apf3\tests -q
.\.venv\Scripts\python.exe -m flake8 apf3 --max-line-length=88
```

El entrenamiento genera `apf3/data/metropolitano_operaciones_2026.csv` solo
si no existe; no reemplaza un archivo preexistente. Guarda el reporte
actualizado en `apf3/resultados.json` y los modelos en `apf3/artifacts/`,
carpeta ignorada por Git. En cada entrenamiento se reemplazan esos artefactos.
Copia únicamente resultados obtenidos realmente al informe, indicando la
semilla, versiones y la naturaleza sintética del conjunto.

La partición es estratificada 80/20 con semilla 42. Imputación, escala y
codificación se ajustan solo con entrenamiento dentro de cada pipeline; Ridge
y Lasso prueban tres valores de alpha con validación cruzada de cinco pliegues.
Los seis clasificadores comparten exactamente la partición de prueba. Se
compara precisión, recall, F1, accuracy, AUC, matriz de confusión y latencia
del lote completo (incluye `predict` y `predict_proba`); las mediciones de
tiempo varían según el equipo. La importancia XGBoost es importancia interna,
no una prueba de causalidad o de superioridad general. Examina los valores
generados: Boosting no necesariamente gana en todos los experimentos.

El grafo dirigido contiene desvíos y pesos inventados. La heurística es la
distancia mínima en el grafo sin incidencia; añadir una penalidad no negativa
mantiene la admisibilidad. BFS minimiza aristas, no tiempo; DFS depende del
orden; A* minimiza el costo de este grafo; Hill Climbing puede quedarse en un
óptimo local. Los tiempos de búsqueda son medidas locales, no ahorro real.

## API local

Después de entrenar, en otra terminal desde la raíz:

```powershell
.\.venv\Scripts\python.exe -m uvicorn apf3.api:app --host 127.0.0.1 --port 8001
```

Abrir http://127.0.0.1:8001/docs para enviar el escenario a `POST /predict`.
Para integrar la ruta al planeador, deja este servicio activo y ejecuta el
frontend web con `npm run web`; Vite reenvía `/ai` a este puerto. En Android
por USB, usa `adb reverse tcp:8001 tcp:8001` junto al reenvío del puerto 8080 de Spring.
`GET /health` responde 503 si faltan modelos. Los modelos se cargan una vez al
ser solicitados; reinicia la API después de reentrenar. La predicción Ridge usa
las variables de entrada y **no** calcula un ETA para la ruta de A*; se informan
por separado. Al llamar desde la aplicación, la hora, demanda, frecuencia,
servicio y distancia son valores de escenario sintéticos predefinidos; la UI
permite elegir hora punta/valle e incidencia. La API no tiene autenticación y
es solo para uso local: no publicarla directamente en Internet. Nunca cargar
archivos joblib de terceros, pues pueden ejecutar código. `APF3_ARTIFACTS_DIR`
permite cambiar el directorio de modelos confiables. `.env.example` es
documentación, no se carga automáticamente.

## Docker y CI

Desde la raíz, ejecuta `docker build -t metropolitano-apf3 apf3` y `docker run --rm -p 8001:10000 metropolitano-apf3`. La imagen incluye los modelos entrenados. GitHub Actions valida Python, Spring y el cliente Expo antes del despliegue opcional. Consulta la [guía de Vercel](../docs/VERCEL.md).

## Accesibilidad

Este módulo no cambia la interfaz existente. No constituye una auditoría ni
certifica WCAG 2.1 AA o cumplimiento de la Ley N.° 29973; esas verificaciones
requieren pruebas específicas de contraste, teclado, lector de pantalla y
evaluación legal y con usuarios.
