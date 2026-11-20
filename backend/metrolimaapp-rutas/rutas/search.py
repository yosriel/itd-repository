"""Comparación de búsquedas sobre un corredor ficticio, no operativo."""

from collections import deque
from dataclasses import asdict, dataclass
from heapq import heappop, heappush
from math import inf
from time import perf_counter
from typing import Callable


Graph = dict[str, dict[str, float]]

# Los desvíos y tiempos son supuestos de un ejercicio, no servicios de ATU.
BASE_GRAPH: Graph = {
    "Naranjal": {"Izaguirre": 5, "Tomas_Valle": 6},
    "Izaguirre": {"Tomas_Valle": 4},
    "Tomas_Valle": {"UNI": 4, "Dos_de_Mayo": 5},
    "UNI": {"Caqueta": 4},
    "Caqueta": {"Estacion_Central": 4},
    "Dos_de_Mayo": {"Espana": 4},
    "Espana": {"Estacion_Central": 4},
    "Estacion_Central": {},
}


@dataclass(frozen=True)
class SearchResult:
    """Resultado comparable; una ruta vacía significa que no se encontró."""

    algorithm: str
    path: list[str]
    nodes_explored: int
    cost_minutes: float | None
    elapsed_ms: float


def graph_with_incident(incident: bool) -> Graph:
    """Añade diez minutos a los tramos que entran a Caquetá."""
    graph = {node: edges.copy() for node, edges in BASE_GRAPH.items()}
    if incident:
        for edges in graph.values():
            if "Caqueta" in edges:
                edges["Caqueta"] += 10
    return graph


def heuristic(goal: str) -> dict[str, float]:
    """Calcula distancias sin incidente: cota inferior admisible y consistente."""
    distances = {node: inf for node in BASE_GRAPH}
    distances[goal] = 0.0
    queue = [(0.0, goal)]
    while queue:
        cost, node = heappop(queue)
        if cost != distances[node]:
            continue
        for previous, edges in BASE_GRAPH.items():
            if node in edges and cost + edges[node] < distances[previous]:
                distances[previous] = cost + edges[node]
                heappush(queue, (distances[previous], previous))
    return distances


def search(algorithm: str, origin: str, destination: str,
           incident: bool = False) -> SearchResult:
    """Ejecuta una búsqueda y mide expansiones, costo y tiempo."""
    if origin not in BASE_GRAPH or destination not in BASE_GRAPH:
        raise ValueError("Estación de origen o destino desconocida")
    if algorithm not in {"bfs", "dfs", "astar", "hill"}:
        raise ValueError("Algoritmo desconocido")
    graph = graph_with_incident(incident)
    h = heuristic(destination)
    start = perf_counter()
    expanded = 0
    path: list[str] = []
    cost: float | None = None

    if algorithm == "hill":
        node, route, total = origin, [origin], 0.0
        while True:
            expanded += 1
            if node == destination:
                path, cost = route, total
                break
            candidates = [n for n in graph[node] if n not in route]
            if not candidates:
                break
            best = min(candidates, key=lambda n: h[n])
            if h[best] >= h[node]:
                break
            total += graph[node][best]
            node = best
            route.append(node)
    elif algorithm == "astar":
        heap = [(h[origin], 0.0, origin, [origin])]
        best_cost = {origin: 0.0}
        while heap:
            _, total, node, route = heappop(heap)
            if total != best_cost[node]:
                continue
            expanded += 1
            if node == destination:
                path, cost = route, total
                break
            for neighbor, weight in graph[node].items():
                candidate = total + weight
                if candidate < best_cost.get(neighbor, inf):
                    best_cost[neighbor] = candidate
                    heappush(heap, (candidate + h[neighbor], candidate,
                                    neighbor, route + [neighbor]))
    else:
        frontier = deque([(origin, [origin], 0.0)])
        visited: set[str] = set()
        while frontier:
            node, route, total = (frontier.popleft() if algorithm == "bfs"
                                  else frontier.pop())
            if node in visited:
                continue
            visited.add(node)
            expanded += 1
            if node == destination:
                path, cost = route, total
                break
            neighbors = list(graph[node].items())
            if algorithm == "dfs":
                neighbors.reverse()
            for neighbor, weight in neighbors:
                if neighbor not in visited:
                    frontier.append((neighbor, route + [neighbor], total + weight))
    return SearchResult(algorithm, path, expanded, cost,
                        (perf_counter() - start) * 1000)


def compare(origin: str = "Naranjal", destination: str = "Estacion_Central",
            incident: bool = True,
            printer: Callable[[str], None] = print) -> list[dict]:
    """Muestra y devuelve resultados; los tiempos varían según la máquina."""
    results = [asdict(search(a, origin, destination, incident))
               for a in ("bfs", "dfs", "astar", "hill")]
    for result in results:
        printer(f"{result['algorithm']:5} ruta={result['path']} "
                f"nodos={result['nodes_explored']} "
                f"costo={result['cost_minutes']} min "
                f"tiempo={result['elapsed_ms']:.4f} ms")
    return results
