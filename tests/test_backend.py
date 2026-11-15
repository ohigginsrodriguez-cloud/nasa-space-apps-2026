from datetime import date
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.catalog import VARIABLES
from app.main import app
from app.schemas.analysis import RegionInfo
from app.services.providers.nasa_power import NasaPowerProvider

client = TestClient(app)


def demo_request(**overrides):
    body = {
        "variable_ids": ["temperature", "precipitation"],
        "region": {"type": "predefined", "id": "amazon-basin"},
        "start_date": "2001-01-01",
        "end_date": "2025-12-31",
        "provider": "demo",
    }
    body.update(overrides)
    return body


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_variable_catalog_has_internal_ids_and_provider_availability() -> None:
    response = client.get("/api/v1/variables")
    assert response.status_code == 200
    catalog = {item["id"]: item for item in response.json()}
    # Must include our core variables and roadmap variables
    assert "temperature" in catalog
    assert "precipitation" in catalog
    assert "soil_moisture" in catalog
    assert "relative_humidity" in catalog
    assert "solar_radiation" in catalog
    assert "surface_pressure" in catalog
    assert "wind_speed" in catalog
    assert "ndvi" in catalog
    assert catalog["temperature"]["available"] is True
    assert catalog["soil_moisture"]["available"] is True
    assert catalog["ndvi"]["available"] is False


def test_provider_filter_reports_real_provider_support() -> None:
    response = client.get("/api/v1/variables?provider=nasa-power")
    catalog = {item["id"]: item for item in response.json()}
    assert catalog["temperature"]["available"] is True
    assert catalog["soil_moisture"]["available"] is True
    assert catalog["solar_radiation"]["available"] is True
    assert catalog["ndvi"]["available"] is False


def test_regions_endpoint_returns_reproducible_bounds() -> None:
    response = client.get("/api/v1/regions")
    assert response.status_code == 200
    amazon = next(row for row in response.json() if row["id"] == "amazon-basin")
    assert amazon["south"] < amazon["north"]
    assert amazon["west"] < amazon["east"]


def test_demo_analysis_supports_multiple_variables_and_long_series() -> None:
    response = client.post("/api/v1/analysis", json=demo_request())
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "demo"
    assert [item["variable"]["id"] for item in body["results"]] == [
        "temperature",
        "precipitation",
    ]
    assert len(body["results"][0]["series"]) == 300
    assert body["results"][0]["trend"]["n_observations"] == 25
    assert body["results"][1]["trend"]["method"] == (
        "linear_regression_on_complete_annual_values"
    )


def test_analysis_rejects_unavailable_variable_for_provider() -> None:
    response = client.post(
        "/api/v1/analysis",
        json=demo_request(variable_ids=["ndvi"]),
    )
    assert response.status_code == 422


def test_analysis_rejects_unknown_variable() -> None:
    response = client.post(
        "/api/v1/analysis",
        json=demo_request(variable_ids=["no-such-variable"]),
    )
    assert response.status_code == 422
    assert response.json()["detail"]["ids"] == ["no-such-variable"]


def test_analysis_rejects_duplicate_variable_ids() -> None:
    response = client.post(
        "/api/v1/analysis",
        json=demo_request(variable_ids=["temperature", "temperature"]),
    )
    assert response.status_code == 422


def test_analysis_validates_bbox_coordinates() -> None:
    response = client.post(
        "/api/v1/analysis",
        json=demo_request(
            region={
                "type": "bbox",
                "south": 30,
                "west": -100,
                "north": 20,
                "east": -90,
            }
        ),
    )
    assert response.status_code == 422


def test_analysis_requires_valid_predefined_region() -> None:
    response = client.post(
        "/api/v1/analysis",
        json=demo_request(region={"type": "predefined", "id": "unknown"}),
    )
    assert response.status_code == 422


def test_analysis_rejects_inverted_dates() -> None:
    response = client.post(
        "/api/v1/analysis",
        json=demo_request(start_date="2025-01-01", end_date="2020-01-01"),
    )
    assert response.status_code == 422


def test_nasa_power_provider_uses_monthly_regional_request_and_converts_rain():
    payload = {
        "features": [
            {
                "geometry": {"coordinates": [-100.0, 10.0]},
                "properties": {
                    "parameter": {
                        "PRECTOTCORR": {
                            "202001": 2.0,
                            "202002": 1.0,
                            "202013": 1.5,
                        }
                    }
                },
            },
            {
                "geometry": {"coordinates": [-99.5, 10.0]},
                "properties": {
                    "parameter": {
                        "PRECTOTCORR": {
                            "202001": 4.0,
                            "202002": 3.0,
                        }
                    }
                }
            },
        ]
    }

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return payload

    with patch("app.services.providers.nasa_power.httpx.get", return_value=FakeResponse()) as get:
        series = NasaPowerProvider().get_series(
            variable=VARIABLES["precipitation"],
            region=RegionInfo(
                id="test",
                name="test",
                type="bbox",
                south=10,
                west=-100,
                north=12,
                east=-98,
            ),
            start_date=date(2020, 1, 1),
            end_date=date(2020, 2, 28),
        )

    assert get.call_args.args[0].endswith("/regional")
    assert series[0].value == 93.0
    assert series[1].value == 58.0
    assert len(series) == 2


def test_nasa_power_provider_parses_point_response():
    payload = {
        "properties": {
            "parameter": {
                "T2M": {
                    "202001": 10.0,
                    "202002": -999.0,
                    "202003": 12.0,
                }
            }
        }
    }

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return payload

    point = RegionInfo(
        id="custom-point",
        name="test",
        type="point",
        south=40,
        west=-75,
        north=40,
        east=-75,
    )
    with patch("app.services.providers.nasa_power.httpx.get", return_value=FakeResponse()) as get:
        series = NasaPowerProvider().get_series(
            variable=VARIABLES["temperature"],
            region=point,
            start_date=date(2020, 1, 1),
            end_date=date(2020, 3, 31),
        )

    assert get.call_args.args[0].endswith("/point")
    assert len(series) == 3
    assert series[0].value == 10
    assert series[1].value is None


def test_nasa_power_rejects_bbox_smaller_than_regional_service_limit():
    small_region = RegionInfo(
        id="small",
        name="small",
        type="bbox",
        south=10,
        west=-100,
        north=11,
        east=-99,
    )
    with patch("app.services.providers.nasa_power.httpx.get") as get:
        try:
            NasaPowerProvider().get_series(
                variable=VARIABLES["temperature"],
                region=small_region,
                start_date=date(2020, 1, 1),
                end_date=date(2020, 12, 31),
            )
        except ValueError as error:
            assert "at least 2 degrees" in str(error)
        else:
            raise AssertionError("Expected small NASA POWER bbox to be rejected")
    get.assert_not_called()


def test_demo_provider_includes_first_month_when_start_date_not_first_day():
    from app.services.providers.demo_provider import DemoProvider
    from app.regions import PREDEFINED_REGIONS

    provider = DemoProvider()
    region = PREDEFINED_REGIONS["sonoran-desert"]
    # 2001-01-15 must include 2001-01-01
    series = provider.get_series(
        variable=VARIABLES["temperature"],
        region=region,
        start_date=date(2001, 1, 15),
        end_date=date(2001, 3, 20),
    )
    assert len(series) == 3
    assert series[0].date == date(2001, 1, 1)
    assert series[1].date == date(2001, 2, 1)
    assert series[2].date == date(2001, 3, 1)


def test_analyze_trend_constant_series_returns_clean_none_without_nan():
    from app.schemas.analysis import Observation
    from app.services.aggregation import analyze_trend

    # 3 years of constant values
    obs = [
        Observation(date=date(y, m, 1), value=20.0)
        for y in range(2020, 2023)
        for m in range(1, 13)
    ]
    trend = analyze_trend(obs, VARIABLES["temperature"])
    assert trend.status == "constant_series"
    assert trend.slope_per_year == 0.0
    assert trend.change_per_decade == 0.0
    assert trend.p_value is None
    assert trend.confidence_interval_per_decade is None
    assert trend.significant is False
    assert len(trend.warnings) > 0


def test_analyze_trend_insufficient_data_when_n_less_than_3():
    from app.schemas.analysis import Observation
    from app.services.aggregation import analyze_trend

    # 2 years
    obs = [
        Observation(date=date(y, m, 1), value=float(y))
        for y in range(2020, 2022)
        for m in range(1, 13)
    ]
    trend = analyze_trend(obs, VARIABLES["temperature"])
    assert trend.status == "insufficient_data"
    assert trend.slope_per_year is None
    assert trend.n_observations == 2

