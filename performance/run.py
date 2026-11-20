"""Mide procesos locales desechables. Ejecutar desde la raíz con el Python de APF3."""
import argparse
import hashlib
import json
import math
import os
import platform
import signal
import socket
import subprocess
import sys
import tempfile
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, ProxyHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]
BACK = ROOT / 'backend/metropolitano-backend-api'
JAR = BACK / 'target/metropolitano-backend-api-0.0.1-SNAPSHOT.jar'
SCENARIO = dict(origen='Naranjal', destino='Estacion_Central', franja_horaria=7.75,
                es_hora_punta=1, distancia_km=12, afluencia_anden=410,
                frecuencia_buses_min=5.5, incidencia_caqueta=1, tipo_servicio='Regular')
results = []


def call(url, data=None, token=None, key=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if key:
        headers['Idempotency-Key'] = key
    req = Request(url, headers=headers, data=None if data is None else json.dumps(data).encode())
    with build_opener(ProxyHandler({})).open(req, timeout=8) as response:
        return json.load(response)


@contextmanager
def service(command, health, env, log):
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = str(sock.getsockname()[1])
    url = 'http://127.0.0.1:' + port
    args = [part.replace('{port}', port) for part in command]
    with open(log, 'w') as out:
        proc = subprocess.Popen(args, cwd=ROOT, env={**os.environ, **env},
                                stdout=out, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            for _ in range(180):
                if proc.poll() is not None:
                    raise RuntimeError('Falló el arranque de ' + args[0] + ', revisar ' + str(log))
                try:
                    call(url + health)
                    break
                except OSError:
                    time.sleep(0.5)
            else:
                raise RuntimeError('Servicio local sin respuesta')
            yield url
        finally:
            if proc.poll() is None:
                os.killpg(proc.pid, signal.SIGTERM)
                proc.wait(timeout=35)


def measure(label, users, count, action, interval=0):
    """Usuarios cerrados sin espera; resistencia usa llegadas espaciadas."""
    def sample(i):
        start = time.perf_counter()
        try:
            action(i)
            error = None
        except HTTPError as exc:
            error = f'HTTP {exc.code}'
            exc.close()
        except URLError as exc:
            error = f'Conexión: {type(exc.reason).__name__}'
        except (OSError, ValueError, AssertionError, KeyError) as exc:
            error = type(exc).__name__
        return (time.perf_counter() - start) * 1000, error

    start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=users) as pool:
        futures = []
        for i in range(count):
            if interval:
                time.sleep(max(0, start + i * interval - time.perf_counter()))
            futures.append(pool.submit(sample, i))
        samples = [f.result() for f in futures]
    elapsed = time.perf_counter() - start
    times = sorted(t for t, _ in samples)
    errors = sum(error is not None for _, error in samples)
    error_types = Counter(error for _, error in samples if error is not None)
    row = dict(phase=label, concurrency=users, requests=count, errors=errors,
               error_types=dict(error_types),
               seconds=round(elapsed, 2), success_rps=round((count-errors)/elapsed, 2),
               p50_ms=round(times[math.ceil(count*.5)-1], 2),
               p95_ms=round(times[math.ceil(count*.95)-1], 2),
               p99_ms=round(times[math.ceil(count*.99)-1], 2))
    results.append(row)
    print(json.dumps(row), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--minutos', type=int, default=15,
                        help='Duración de resistencia, de 1 a 240 minutos')
    parser.add_argument('--salida', type=Path, default=ROOT/'performance/resultados.json',
                        help='Ruta del informe JSON')
    options = parser.parse_args()
    minutes = options.minutos
    if not 1 <= minutes <= 240:
        parser.error('Usa de 1 a 240 minutos')
    if not JAR.is_file():
        raise SystemExit('Compilar primero el JAR con Maven y Java 21')
    python = [sys.executable, '-m', 'uvicorn', 'apf3.api:app', '--host', '127.0.0.1',
              '--port', '{port}', '--no-access-log']
    env = {'OMP_NUM_THREADS': '1', 'OPENBLAS_NUM_THREADS': '1'}
    java = str(Path(os.environ['JAVA_HOME']) / 'bin/java')
    with tempfile.TemporaryDirectory() as tmp:
        with service([java, '-jar', str(JAR), '--server.address=127.0.0.1',
                      '--server.port={port}', '--spring.profiles.active=demo'],
                     '/actuator/health', {'DEMO_DB_URL': 'jdbc:h2:mem:perf;DB_CLOSE_DELAY=-1'},
                     Path(tmp)/'spring.log') as spring:
            base = spring + '/api/v1/demo'
            token = call(base+'/sessions/presentation', {})['token']
            def state():
                return call(base+'/state', token=token)

            with service(python, '/health', env, Path(tmp)/'ai.log') as ai:
                def prediction(url):
                    result = call(url+'/predict', SCENARIO)
                    assert result['costo_grafo_minutos'] == 19 and result['ruta'][0] == 'Naranjal'

                def mix(i):
                    if i % 4 == 0:
                        prediction(ai)
                    else:
                        assert state()['dataMode'] == 'SIMULATED'

                mix(0)
                mix(1)
                measure('carga', 6, 480, mix)
                for users in [4, 12, 24]:
                    measure('estres', users, 320, mix)
                for users in [2, 24, 2]:
                    measure('picos', users, 160, mix)
                for minute in range(1, minutes + 1):
                    measure('resistencia', 4, 300, mix, interval=.2)
                    results[-1]['minuto'] = minute
                initial = Decimal(state()['balance'])
                def recharge(i):
                    result = call(base+'/recharges', {'amount': '5.00', 'method': 'CARD_DEMO'},
                                  token, 'perf-volume-' + str(i))
                    assert Decimal(result['amount']) == 5
                measure('volumen-escritura', 4, 1000, recharge)
                final = state()
                assert Decimal(final['balance']) == initial + 5000
                assert len(final['recharges']) == 50
                measure('volumen-lectura', 6, 400, lambda _: state())
                measure('escala-1-worker', 8, 240, lambda _: prediction(ai))
            with service(python + ['--workers', '2'], '/health', env, Path(tmp)/'ai2.log') as ai:
                for _ in range(8):
                    prediction(ai)
                measure('escala-2-workers', 8, 240, lambda _: prediction(ai))
    report = dict(utc=datetime.now(timezone.utc).isoformat(), os=platform.platform(),
                  python=platform.python_version(), cpu=os.cpu_count(), jar_sha256=hashlib.sha256(JAR.read_bytes()).hexdigest(),
                  saldo_verificado=True, historial_visible=50, profiles=results)
    options.salida.write_text(json.dumps(report, indent=2)+'\n')
    if any(row['errors'] for row in results):
        raise SystemExit('Se observaron errores; consultar resultados.json')


if __name__ == '__main__':
    main()
