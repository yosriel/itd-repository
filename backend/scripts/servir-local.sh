#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${JAVA_HOME:?Configura el directorio del JDK 21}"
routes="$PWD/metrolimaapp-rutas"
python="$routes/.venv/bin/python"
backend="$PWD/metropolitano-backend-api"
jar="$backend/target/metropolitano-backend-api-0.0.1-SNAPSHOT.jar"
test -f "$jar" || { echo 'Compila el backend con ./mvnw package' >&2; exit 1; }
test -x "$python" || { echo 'Crea .venv e usa requirements.txt en metrolimaapp-rutas' >&2; exit 1; }
test -f "${APF3_ARTIFACTS_DIR:-$routes/artifacts}/ridge.joblib" || { echo 'Entrena los modelos con python -m rutas.experiment desde metrolimaapp-rutas' >&2; exit 1; }
(cd "$backend"; exec "$JAVA_HOME/bin/java" -jar "$jar" --server.address=127.0.0.1 --server.port=8080) &
spring=$!
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 "$python" -m uvicorn --app-dir "$routes" rutas.api:app --host 127.0.0.1 --port 8001 &
ai=$!
trap 'kill "$spring" "$ai" 2>/dev/null || true; wait || true' EXIT
trap 'exit 130' INT TERM
wait -n "$spring" "$ai"
