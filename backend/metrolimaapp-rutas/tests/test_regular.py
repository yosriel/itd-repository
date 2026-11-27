from fastapi.testclient import TestClient

from rutas.api import app
from rutas.regular import CATALOG, SERVICES


def test_catalog_uses_the_four_atu_services_and_all_operating_stops():
    assert {name: len(stops) for name, stops in SERVICES.items()} == {
        "A": 16, "B": 21, "C": 24, "D": 15,
    }
    expected_stations = {stop for stops in SERVICES.values() for stop in stops}
    assert len(CATALOG["stations"]) == len(expected_stations) == 44
    assert {station["name"] for station in CATALOG["stations"]} == expected_stations
    assert "Las Vegas" in SERVICES["B"]
    assert "Tacna" in SERVICES["A"] and "Tacna" not in SERVICES["D"]
    assert "Dos de Mayo" in SERVICES["D"] and "Dos de Mayo" not in SERVICES["A"]
    assert TestClient(app).get("/regular/catalog").json() == CATALOG


def test_direct_routes_operate_in_both_directions():
    client = TestClient(app)
    for service, stops in SERVICES.items():
        for direction, expected in (("sur", stops), ("norte", list(reversed(stops)))):
            response = client.post("/regular/plan", json={
                "origin": expected[0], "destination": expected[-1], "service": service,
            })
            assert response.status_code == 200
            assert response.json()["options"] == [[{
                "service": service, "stops": expected,
                "toward": expected[-1], "direction": direction,
            }]]


def test_transfer_central_and_station_validation():
    client = TestClient(app)
    request = {"origin": "Chimpu Ocllo", "destination": "Matellini"}
    options = client.post("/regular/plan", json=request).json()["options"]
    first, second = options[0]
    assert [first["service"], second["service"]] == ["B", "C"]
    assert first["stops"][-1] == second["stops"][0] == "Estación Central"
    assert client.post("/regular/plan", json={**request, "service": "D"}).json() == {
        "options": [],
    }
    invalid_requests = (
        {"origin": "desconocida"}, {"origin": "Matellini"}, {"service": "X"},
    )
    for invalid in invalid_requests:
        response = client.post("/regular/plan", json={**request, **invalid})
        assert response.status_code == 422
