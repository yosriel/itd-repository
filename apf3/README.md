# APF3: experimentos reproducibles

Este módulo Python es un microservicio experimental separado del backend
Java/Spring. El planeador web/móvil lo consulta al elegir una ruta en sesión
conectada; el Vite proxy y el reenvío USB usan el puerto 8001. Las pantallas
offline conservan su cálculo local. No alimenta las alertas ni las transacciones.
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
por USB, `npm run android:usb` configura el reenvío del puerto 8001 junto al
de Spring.
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

El workflow ejecuta flake8, pytest y construye una imagen que entrena modelos
sintéticos durante el build en pushes/PR hacia `main` o `develop`. El despliegue
a un servicio ECS **existente** es opcional: solo se intenta al hacer push a
`main` si `ENABLE_ECS_DEPLOY=true`, y requiere configurar `AWS_ROLE_ARN` como
secreto OIDC y las variables `AWS_REGION`, `ECR_REPOSITORY`, `ECS_CLUSTER` y
`ECS_SERVICE`, además de crear antes ECR, clúster/servicio y permisos IAM. No se
crean recursos ni se generan cargos por AWS hasta configurar y habilitar esta
opción. La imagen se construye con el dataset sintético y modelos entrenados
en build; si se vuelve a entrenar en producción se necesita un proceso de
promoción validado. La definición de tarea ECS existente debe usar la imagen
del repositorio `latest`, escuchar el puerto 8000 y permitir el health check
`/health` desde el balanceador privado. Para probar Docker, instala primero
Docker y, desde la raíz:

```powershell
docker build -f apf3\Dockerfile -t metropolitano-apf3 .
docker run --rm -p 127.0.0.1:8001:8000 metropolitano-apf3
```

El entrenamiento se ejecuta durante el build. Para ejecución local sin Docker,
el entrenamiento sí debe haberse ejecutado en el host primero. No se crearon
recursos AWS ni se validó despliegue en una cuenta. Para producción se requiere
red privada y autenticación entre servicios, HTTPS, monitoreo, pruebas de carga
y una estrategia de promoción/rollback. No guardar claves en el repositorio.

## Accesibilidad

Este módulo no cambia la interfaz existente. No constituye una auditoría ni
certifica WCAG 2.1 AA o cumplimiento de la Ley N.° 29973; esas verificaciones
requieren pruebas específicas de contraste, teclado, lector de pantalla y
evaluación legal y con usuarios.