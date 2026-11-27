"""Pruebas de búsqueda, datos, modelos y API de demostración."""

import math

import joblib
import pytest
from fastapi.testclient import TestClient

from rutas.api import app, load_models
from rutas.data_pipeline import (FEATURES, generate_dataset, load_dataset,
                                 split_dataset)
from rutas.experiment import (classification_metrics, classification_models,
                              regression_models)
from rutas.search import BASE_GRAPH, graph_with_incident, heuristic, search


@pytest.mark.parametrize("algorithm", ["bfs", "dfs", "astar", "hill"])
def test_search_returns_connected_path_and_measured_cost(algorithm):
    """Cada ruta informada debe existir y sumar su costo real."""
    graph = graph_with_incident(True)
    result = search(algorithm, "Naranjal", "Estacion_Central", True)
    assert result.path[0] == "Naranjal"
    assert result.path[-1] == "Estacion_Central"
    assert result.nodes_explored > 0
    assert result.elapsed_ms >= 0
    assert result.cost_minutes == sum(
        graph[a][b] for a, b in zip(result.path, result.path[1:]))


def test_astar_incident_and_heuristic():
    """El costo cambia por la incidencia y A* elige el desvío de prueba."""
    normal = search("astar", "Naranjal", "Estacion_Central")
    incident = search("astar", "Naranjal", "Estacion_Central", True)
    assert normal.cost_minutes == 18
    assert incident.cost_minutes == 19
    assert "Caqueta" not in incident.path
    for goal in BASE_GRAPH:
        h = heuristic(goal)
        assert h[goal] == 0
        for node, edges in graph_with_incident(True).items():
            for other, cost in edges.items():
                assert h[node] <= cost + h[other]
    with pytest.raises(ValueError):
        search("astar", "No_existe", "Estacion_Central")
    assert not search("astar", "Estacion_Central", "Naranjal").path


def test_data_reproducibility_and_split(tmp_path):
    """El generador es determinista y crea el archivo sin reemplazarlo."""
    first = generate_dataset()
    assert first.equals(generate_dataset())
    assert len(first) == 5000
    path = tmp_path / "synthetic.csv"
    loaded = load_dataset(path)
    assert len(loaded) == 5000
    train_x, test_x, train_y, test_y = split_dataset(loaded)
    assert (len(train_x), len(test_x)) == (4000, 1000)
    assert abs(train_y.saturacion_critica.mean() -
               test_y.saturacion_critica.mean()) < 0.01
    assert list(train_x.columns) == FEATURES


@pytest.fixture(scope="module")
def fitted_models():
    """Ajusta todos los estimadores en el mismo conjunto sintético reducido."""
    x_train, x_test, y_train, y_test = split_dataset(generate_dataset(400))
    regressors = regression_models()
    classifiers = classification_models()
    for model in regressors.values():
        model.fit(x_train, y_train["eta_minutos"])
        assert len(model.predict(x_test)) == len(x_test)
    for model in classifiers.values():
        model.fit(x_train, y_train["saturacion_critica"])
        metrics = classification_metrics(model, x_test, y_test["saturacion_critica"])
        assert all(math.isfinite(value) for key, value in metrics.items()
                   if key not in {"confusion_matrix", "parametros"})
        assert sum(map(sum, metrics["confusion_matrix"])) == len(x_test)
    return regressors, classifiers


def test_models_fit(fitted_models):
    """Todos los modelos requeridos están disponibles y entrenan."""
    regressors, classifiers = fitted_models
    assert set(regressors) == {"lineal", "polinomica", "ridge", "lasso"}
    assert set(classifiers) == {"logistica", "svm", "knn", "arbol",
                                "gradient_boosting", "xgboost"}


def test_api_end_to_end_and_missing_models(tmp_path, monkeypatch, fitted_models):
    """Comprueba datos, validación y fallo explícito al faltar artefactos."""
    monkeypatch.setenv("APF3_ARTIFACTS_DIR", str(tmp_path))
    load_models.cache_clear()
    client = TestClient(app)
    assert client.get("/health").status_code == 503
    regressors, classifiers = fitted_models
    joblib.dump(regressors["ridge"], tmp_path / "ridge.joblib")
    joblib.dump(classifiers["xgboost"], tmp_path / "xgboost.joblib")
    scenario = {
        "origen": "Naranjal", "destino": "Estacion_Central",
        "franja_horaria": 7.75, "es_hora_punta": 1, "distancia_km": 12,
        "afluencia_anden": 410, "frecuencia_buses_min": 5.5,
        "incidencia_caqueta": 1, "tipo_servicio": "Regular",
    }
    assert client.get("/health").json()["status"] == "ok"
    response = client.post("/predict", json=scenario)
    assert response.status_code == 200
    body = response.json()
    assert body["ruta"] == ["Naranjal", "Tomas_Valle", "Dos_de_Mayo",
                            "Espana", "Estacion_Central"]
    assert body["costo_grafo_minutos"] == 19
    assert math.isfinite(body["eta_modelo_minutos"])
    assert 0 <= body["probabilidad_saturacion"] <= 1
    assert isinstance(body["saturacion_critica"], bool)
    reverse = client.post("/predict", json={
        **scenario, "origen": "Estacion_Central", "destino": "Naranjal",
    })
    assert reverse.status_code == 200
    assert reverse.json()["ruta"] == list(reversed(body["ruta"]))
    assert client.post("/predict", json={**scenario, "distancia_km": -1}
                       ).status_code == 422
    assert client.post("/predict", json={**scenario, "destino": "Inexistente"}
                       ).status_code == 422
    assert client.post("/predict", json={**scenario, "dato_extra": 1}
                       ).status_code == 422
    load_models.cache_clear()
