"""Datos sintéticos reproducibles para experimentos académicos."""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RANDOM_STATE = 42
NUMERIC = ["franja_horaria", "es_hora_punta", "distancia_km",
           "afluencia_anden", "frecuencia_buses_min", "incidencia_caqueta"]
CATEGORICAL = ["tipo_servicio"]
FEATURES = NUMERIC + CATEGORICAL
TARGETS = ["eta_minutos", "saturacion_critica"]
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DATA_PATH = DATA_DIR / "metropolitano_operaciones_2026.csv"


def generate_dataset(size: int = 5000) -> pd.DataFrame:
    """Genera observaciones ficticias; no representan mediciones de transporte."""
    rng = np.random.default_rng(RANDOM_STATE)
    hour = rng.uniform(5, 23, size)
    peak = (((hour >= 6.5) & (hour <= 9.5)) |
            ((hour >= 17.5) & (hour <= 20.5))).astype(int)
    distance = rng.uniform(0.8, 26, size)
    crowd = np.clip(rng.normal(125 + peak * 125, 70, size), 15, 480)
    frequency = rng.uniform(2, 12, size)
    incident = rng.binomial(1, 0.18 + 0.1 * peak, size)
    service = rng.choice(["Regular", "Expreso"], size)
    eta = (3 + distance * 1.15 + frequency * 0.45 + peak * 3 +
           incident * 6 + crowd * 0.012 - (service == "Expreso") * 3 +
           rng.normal(0, 2, size))
    latent = (crowd / 75 + peak * 0.7 + incident * 0.8 +
              frequency * 0.16 + rng.normal(0, 0.8, size))
    saturation = (latent > 4.4).astype(int)
    return pd.DataFrame({
        "franja_horaria": hour, "es_hora_punta": peak,
        "distancia_km": distance, "afluencia_anden": crowd.round().astype(int),
        "frecuencia_buses_min": frequency, "incidencia_caqueta": incident,
        "tipo_servicio": service, "eta_minutos": np.maximum(eta, 1),
        "saturacion_critica": saturation,
    })


def load_dataset(path: Path = DATA_PATH) -> pd.DataFrame:
    """Carga o crea el CSV sintético; rechaza un archivo inválido."""
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        generate_dataset().to_csv(path, index=False)
    data = pd.read_csv(path)
    missing = set(FEATURES + TARGETS) - set(data.columns)
    if missing:
        raise ValueError(f"Faltan columnas en {path}: {sorted(missing)}")
    data = data.drop_duplicates().dropna(subset=TARGETS).copy()
    for column in NUMERIC + TARGETS:
        data[column] = pd.to_numeric(data[column], errors="raise")
    if not set(data["saturacion_critica"].unique()).issubset({0, 1}):
        raise ValueError("saturacion_critica debe contener únicamente 0 y 1")
    return data


def split_dataset(data: pd.DataFrame) -> tuple:
    """Usa una partición común 80/20 estratificada para todos los modelos."""
    return train_test_split(data[FEATURES], data[TARGETS], test_size=0.2,
                            stratify=data["saturacion_critica"],
                            random_state=RANDOM_STATE)


def preprocessor() -> ColumnTransformer:
    """Imputa y escala dentro del pipeline para evitar fuga entre particiones."""
    numeric = Pipeline([("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler())])
    categorical = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])
    return ColumnTransformer([("numeric", numeric, NUMERIC),
                              ("categorical", categorical, CATEGORICAL)])
