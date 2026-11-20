FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
ENV PORT=10000
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r /app/requirements.txt \
    && useradd --create-home appuser
COPY . /app
RUN OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python -m rutas.experiment > /tmp/rutas-training.log \
    && rm -rf /app/data /tmp/rutas-training.log
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ.get('PORT', '10000') + '/health', timeout=3)"
CMD ["sh", "-c", "uvicorn rutas.api:app --host 0.0.0.0 --port ${PORT:-10000}"]
