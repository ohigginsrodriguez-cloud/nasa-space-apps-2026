from fastapi.testclient import TestClient
import pytest

from app.catalog import VARIABLES
from app.main import app
from app.regions import PREDEFINED_REGIONS

client = TestClient(app)
ACTIVE_IDS = [key for key, variable in VARIABLES.items() if variable.nasa_power_available]


@pytest.mark.parametrize("region_id", [
    "sonoran-desert", "lacandon-jungle", "tabasco-wetlands", "valley-of-mexico",
])
def test_mexican_regions_support_all_seven_variables(region_id):
    response = client.post("/api/v1/analysis", json={
        "variable_ids": ACTIVE_IDS, "provider": "demo",
        "region": {"type": "predefined", "id": region_id},
        "start_date": "1991-01-01", "end_date": "2023-12-31",
    })
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["results"]) == 7
    assert all(len(result["series"]) == 396 for result in body["results"])
    assert all(result["trend"]["data_source"] == "demo" for result in body["results"])
    assert "NaN" not in response.text and "Infinity" not in response.text


def test_catalog_only_exposes_mexican_study_locations():
    regions = client.get("/api/v1/regions").json()
    assert {region["id"] for region in regions} == set(PREDEFINED_REGIONS)
    assert len(regions) == 4
    for region in regions:
        assert 14 <= region["south"] <= region["north"] <= 33
        assert -118 <= region["west"] <= region["east"] <= -86
        if region["type"] != "point":
            assert 2 <= region["north"] - region["south"] <= 10
            assert 2 <= region["east"] - region["west"] <= 10
