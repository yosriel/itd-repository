"""Planifica trayectos sobre las secuencias oficiales de las rutas regulares."""

import json
from pathlib import Path

CATALOG = json.loads(Path(__file__).with_name("regular_services.json")
                     .read_text(encoding="utf-8"))
STATIONS = {station["name"] for station in CATALOG["stations"]}
SERVICES = {service["id"]: service["stops"] for service in CATALOG["services"]}


def segment(service: str, origin: str, destination: str) -> dict:
    """Construye un tramo con las paradas en el sentido del viaje."""
    stops = SERVICES[service]
    start, end = stops.index(origin), stops.index(destination)
    south = start < end
    ordered = stops[start:end + 1] if south else stops[end:start + 1][::-1]
    return {"service": service, "stops": ordered,
            "toward": stops[-1] if south else stops[0],
            "direction": "sur" if south else "norte"}


def itineraries(origin: str, destination: str, service: str | None = None) -> list:
    """Prefiere viajes directos. Si se requiere, propone un transbordo."""
    if service:
        if origin in SERVICES[service] and destination in SERVICES[service]:
            return [[segment(service, origin, destination)]]
        return []

    boarding = [name for name, stops in SERVICES.items() if origin in stops]
    alighting = [name for name, stops in SERVICES.items() if destination in stops]
    direct = [[segment(name, origin, destination)] for name in boarding
              if name in alighting]
    if direct:
        return sorted(direct, key=lambda route: len(route[0]["stops"]))

    transfers = []
    for first in boarding:
        for second in alighting:
            best = None
            for transfer in SERVICES[first]:
                if (transfer not in SERVICES[second]
                        or transfer in (origin, destination)):
                    continue
                legs = [segment(first, origin, transfer),
                        segment(second, transfer, destination)]
                cost = sum(len(leg["stops"]) for leg in legs)
                # En igualdad de paradas se prefiere el intercambiador Central.
                rank = (cost, transfer != "Estación Central", transfer)
                if best is None or rank < best[0]:
                    best = (rank, legs)
            if best:
                transfers.append(best)
    return [legs for _, legs in sorted(transfers, key=lambda option: option[0])]
