from fastapi.testclient import TestClient

from app.main import app


def test_compare_custom_areas_preserves_geometry_and_identity():
    areas = [
        {"type": "bbox", "name": "Area A", "south": 20, "north": 22, "west": -104, "east": -102},
        {"type": "bbox", "name": "Area B", "south": 16, "north": 19, "west": -94, "east": -91},
    ]
    response = TestClient(app).post("/api/v1/analysis/compare", json={
        "variable_id": "temperature", "regions": areas, "provider": "demo",
        "start_date": "1991-01-01", "end_date": "2023-12-31",
    })
    assert response.status_code == 200, response.text
    result = response.json()
    for index, area in enumerate(areas):
        region = result["regions"][index]["region"]
        assert region["name"] == area["name"]
        assert region["id"] == f"comparison-area-{index + 1}"
        assert all(region[key] == area[key] for key in ("south", "north", "west", "east"))
    assert len(result["spatial_interpretation"]["regions"]) == 2


def test_identical_custom_areas_are_rejected():
    area = {"type": "bbox", "south": 20, "north": 22, "west": -104, "east": -102}
    response = TestClient(app).post("/api/v1/analysis/compare", json={
        "variable_id": "temperature", "regions": [area, area], "provider": "demo",
        "start_date": "1991-01-01", "end_date": "2023-12-31",
    })
    assert response.status_code == 422
