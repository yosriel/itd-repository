"""Entrenamiento y evaluación reproducibles del APF3."""

import json
from pathlib import Path
from time import perf_counter

import joblib
import numpy as np
from sklearn.linear_model import Lasso, LinearRegression, LogisticRegression, Ridge
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             mean_absolute_error, mean_squared_error,
                             precision_score, r2_score, recall_score, roc_auc_score)
from sklearn.model_selection import GridSearchCV
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import GradientBoostingClassifier
from xgboost import XGBClassifier

from rutas.data_pipeline import (RANDOM_STATE, load_dataset, preprocessor,
                                 split_dataset)
from rutas.search import compare

SERVICE_DIR = Path(__file__).resolve().parents[1]
ARTIFACTS = SERVICE_DIR / "artifacts"


def regression_models() -> dict:
    """Construye modelos y búsqueda de hiperparámetros sin fuga de datos."""
    def poly_model(model):
        return Pipeline([("prep", preprocessor()),
                         ("poly", PolynomialFeatures(include_bias=False)),
                         ("model", model)])

    return {
        "lineal": Pipeline([("prep", preprocessor()), ("model", LinearRegression())]),
        "polinomica": poly_model(LinearRegression()).set_params(poly__degree=2),
        "lasso": GridSearchCV(poly_model(Lasso(max_iter=20000)), {
            "poly__degree": [2], "model__alpha": [0.01, 0.05, 0.1],
        }, cv=5, scoring="neg_mean_absolute_error", n_jobs=1),
        "ridge": GridSearchCV(poly_model(Ridge()), {
            "poly__degree": [2], "model__alpha": [0.1, 1.0, 10.0],
        }, cv=5, scoring="neg_mean_absolute_error", n_jobs=1),
    }


def classification_models() -> dict:
    """Construye clasificadores comparables sobre el mismo conjunto de datos."""
    estimators = {
        "logistica": LogisticRegression(class_weight="balanced", max_iter=2000,
                                        random_state=RANDOM_STATE),
        "svm": SVC(kernel="rbf", probability=True, random_state=RANDOM_STATE),
        "knn": KNeighborsClassifier(n_neighbors=7, weights="distance"),
        "arbol": DecisionTreeClassifier(
            max_depth=6, min_samples_split=15, random_state=RANDOM_STATE),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=100, max_depth=3, random_state=RANDOM_STATE),
        "xgboost": XGBClassifier(n_estimators=100, max_depth=3,
                                 learning_rate=0.08, subsample=0.85,
                                 random_state=RANDOM_STATE, n_jobs=1,
                                 eval_metric="logloss"),
    }
    return {name: Pipeline([("prep", preprocessor()), ("model", model)])
            for name, model in estimators.items()}


def classification_metrics(model, x_test, y_test) -> dict:
    """Calcula métricas en prueba y latencia de inferencia del lote."""
    start = perf_counter()
    predicted = model.predict(x_test)
    probabilities = model.predict_proba(x_test)[:, 1]
    elapsed = (perf_counter() - start) * 1000
    estimator = model.named_steps["model"]
    parameter_names = (
        "C", "kernel", "n_neighbors", "weights", "criterion", "max_depth",
        "min_samples_split", "n_estimators", "learning_rate", "subsample",
        "class_weight", "eval_metric",
    )
    parameters = {name: estimator.get_params()[name] for name in parameter_names
                  if name in estimator.get_params()}
    return {
        "accuracy": float(accuracy_score(y_test, predicted)),
        "precision": float(precision_score(y_test, predicted, zero_division=0)),
        "recall": float(recall_score(y_test, predicted, zero_division=0)),
        "f1": float(f1_score(y_test, predicted, zero_division=0)),
        "auc_roc": float(roc_auc_score(y_test, probabilities)),
        "confusion_matrix": confusion_matrix(y_test, predicted).tolist(),
        "inference_ms_batch": elapsed,
        "parametros": parameters,
    }


def run_experiment(output: Path = ARTIFACTS) -> dict:
    """Entrena modelos, imprime comparaciones y guarda artefactos locales."""
    data = load_dataset()
    x_train, x_test, y_train, y_test = split_dataset(data)
    results = {
        "datos": {"tipo": "sinteticos", "semilla": RANDOM_STATE,
                  "registros": len(data), "entrenamiento": len(x_train),
                  "prueba": len(x_test)},
        "busqueda": compare(),
        "regresion": {}, "clasificacion": {},
    }
    trained = {}
    print("\nREGRESION (prueba):")
    for name, model in regression_models().items():
        model.fit(x_train, y_train["eta_minutos"])
        predicted = model.predict(x_test)
        metrics = {
            "r2": float(r2_score(y_test["eta_minutos"], predicted)),
            "rmse": float(np.sqrt(mean_squared_error(
                y_test["eta_minutos"], predicted))),
            "mae": float(mean_absolute_error(y_test["eta_minutos"], predicted)),
            "parametros": getattr(model, "best_params_", {
                "model__fit_intercept": True
            } if name == "lineal" else {"poly__degree": 2}),
        }
        results["regresion"][name] = metrics
        trained[name] = model
        print(f"{name:12} R2={metrics['r2']:.3f} "
              f"RMSE={metrics['rmse']:.3f} MAE={metrics['mae']:.3f}")

    print("\nCLASIFICACION (mismo conjunto de prueba):")
    print("modelo              accuracy precision recall    F1      AUC    ms/lote")
    for name, model in classification_models().items():
        model.fit(x_train, y_train["saturacion_critica"])
        metrics = classification_metrics(model, x_test, y_test["saturacion_critica"])
        results["clasificacion"][name] = metrics
        trained[name] = model
        print(f"{name:18} {metrics['accuracy']:.3f}    "
              f"{metrics['precision']:.3f}     {metrics['recall']:.3f}   "
              f"{metrics['f1']:.3f}   {metrics['auc_roc']:.3f}   "
              f"{metrics['inference_ms_batch']:.2f}")

    xgb = trained["xgboost"]
    names = xgb.named_steps["prep"].get_feature_names_out()
    importance = xgb.named_steps["model"].feature_importances_
    results["importancia_xgboost"] = dict(zip(names.tolist(), map(float, importance)))
    print("\nImportancia XGBoost:", results["importancia_xgboost"])
    print("La superioridad de un modelo depende de las métricas y datos observados.")
    output.mkdir(parents=True, exist_ok=True)
    joblib.dump(trained["ridge"], output / "ridge.joblib")
    joblib.dump(trained["xgboost"], output / "xgboost.joblib")
    (SERVICE_DIR / "resultados.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    return results


if __name__ == "__main__":
    run_experiment()
