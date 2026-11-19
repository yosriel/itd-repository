"""Ejecuta un escenario completo sin iniciar un servidor web."""

import json

from apf3.api import PredictionRequest, predict


def main() -> None:
    """Imprime una predicción; requiere entrenamiento previo."""
    scenario = PredictionRequest(
        origen="Naranjal", destino="Estacion_Central",
        franja_horaria=7.75, es_hora_punta=1, distancia_km=12,
        afluencia_anden=410, frecuencia_buses_min=5.5,
        incidencia_caqueta=1, tipo_servicio="Regular",
    )
    print(json.dumps(predict(scenario), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
