"""API de investigación local: no es un servicio oficial ni de producción."""

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from apf3.data_pipeline import FEATURES
from apf3.experiment import ARTIFACTS
from apf3.search import BASE_GRAPH, search

app = FastAPI(title="Metropolitano APF3 - datos sintéticos", version="1.0")
allowed_origins = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


class PredictionRequest(BaseModel):
    """Entrada numérica de un escenario simulado, sin datos personales."""

    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    origen: str = "Naranjal"
    destino: str = "Estacion_Central"
    franja_horaria: float = Field(ge=5, le=23)
    es_hora_punta: Literal[0, 1]
    distancia_km: float = Field(gt=0, le=26)
    afluencia_anden: int = Field(ge=0, le=1000)
    frecuencia_buses_min: float = Field(gt=0, le=60)
    incidencia_caqueta: Literal[0, 1]
    tipo_servicio: Literal["Regular", "Expreso"]


@lru_cache(maxsize=1)
def load_models() -> tuple:
    """Carga artefactos generados localmente y de fuente confiable."""
    directory = Path(os.environ.get("APF3_ARTIFACTS_DIR", str(ARTIFACTS)))
    paths = [directory / "ridge.joblib", directory / "xgboost.joblib"]
    if not all(path.is_file() for path in paths):
        raise FileNotFoundError(
            "Ejecuta python -m apf3.experiment antes de iniciar la API")
    return tuple(joblib.load(path) for path in paths)


@app.get("/health")
def health() -> dict:
    """Informa si los modelos están disponibles; no realiza entrenamiento."""
    try:
        load_models()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"status": "ok", "datos": "sinteticos"}


@app.post("/predict")
def predict(request: PredictionRequest) -> dict:
    """Devuelve ruta A*, estimación Ridge y clasificación XGBoost simuladas."""
    if request.origen not in BASE_GRAPH or request.destino not in BASE_GRAPH:
        raise HTTPException(status_code=422, detail="Estación desconocida")
    result = search("astar", request.origen, request.destino,
                    bool(request.incidencia_caqueta))
    if not result.path:
        raise HTTPException(status_code=422,
                            detail="No existe ruta en el grafo simulado")
    try:
        ridge, xgb = load_models()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    features = pd.DataFrame([request.model_dump(include=set(FEATURES))],
                            columns=FEATURES)
    eta = float(ridge.predict(features)[0])
    probability = float(xgb.predict_proba(features)[0, 1])
    return {
        "datos": "sinteticos; no representan informacion real ni oficial",
        "ruta": result.path,
        "costo_grafo_minutos": result.cost_minutes,
        "eta_modelo_minutos": round(eta, 2),
        "saturacion_critica": bool(xgb.predict(features)[0]),
        "probabilidad_saturacion": round(probability, 4),
        "nota": "La prediccion Ridge usa las variables recibidas, "
                "no los tramos de la ruta calculada.",
    }
