#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${JAVA_HOME:?Configura el directorio del JDK 21}"
python="$PWD/.venv/bin/python"
backend="$PWD/backend/metropolitano-backend-api"
jar="$backend/target/metropolitano-backend-api-0.0.1-SNAPSHOT.jar"
test -f "$jar" || { echo 'Compila el backend con ./mvnw package' >&2; exit 1; }
test -x "$python" || { echo 'Crea .venv e instala apf3/requirements.txt' >&2; exit 1; }
test -f "${APF3_ARTIFACTS_DIR:-apf3/artifacts}/ridge.joblib" || { echo 'Entrena los modelos con python -m apf3.experiment' >&2; exit 1; }
(cd "$backend"; exec "$JAVA_HOME/bin/java" -jar "$jar" --server.address=127.0.0.1 --server.port=8080) &
spring=$!
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 "$python" -m uvicorn apf3.api:app --host 127.0.0.1 --port 8001 &
ai=$!
trap 'kill "$spring" "$ai" 2>/dev/null || true; wait || true' EXIT
trap 'exit 130' INT TERM
wait -n "$spring" "$ai"
