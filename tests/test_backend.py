from datetime import date

from fastapi.testclient import TestClient

from app.main import app
from app.services.normalizer import normalize_rows


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_series_endpoint_returns_normalized_data() -> None:
    response = client.get(
        "/series",
        params={"start": "2020-01-01", "end": "2020-03-01"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["variable"]["id"] == "surface_temperature"
    assert len(body["series"]) == 3
    assert body["series"][0]["date"] == "2020-01-01"


def test_series_rejects_unknown_variable() -> None:
    response = client.get("/series", params={"variable": "unknown"})

    assert response.status_code == 400
    assert "Unknown variable" in response.json()["detail"]


def test_series_rejects_inverted_dates() -> None:
    response = client.get(
        "/series",
        params={"start": "2021-01-01", "end": "2020-01-01"},
    )

    assert response.status_code == 400


def test_variables_endpoint_returns_available_variables() -> None:
    response = client.get("/variables")

    assert response.status_code == 200
    assert response.json()[0]["id"] == "surface_temperature"


def test_series_returns_404_when_period_has_no_data() -> None:
    response = client.get(
        "/series",
        params={"start": "2030-01-01", "end": "2030-12-31"},
    )

    assert response.status_code == 404


def test_series_accepts_same_start_and_end_date() -> None:
    response = client.get(
        "/series",
        params={"start": "2020-01-01", "end": "2020-01-01"},
    )

    assert response.status_code == 200
    assert len(response.json()["series"]) == 1


def test_normalizer_sorts_rows_and_preserves_missing_values() -> None:
    result = normalize_rows(
        [
            {"date": "2020-02-01", "value": ""},
            {"date": "2020-01-01", "value": "10.5"},
        ]
    )

    assert result[0].date == date(2020, 1, 1)
    assert result[1].value is None


def test_normalizer_converts_non_finite_values_to_missing() -> None:
    result = normalize_rows(
        [
            {"date": "2020-01-01", "value": "NaN"},
            {"date": "2020-02-01", "value": "inf"},
        ]
    )

    assert result[0].value is None
    assert result[1].value is None


def test_normalizer_rejects_non_numeric_values() -> None:
    try:
        normalize_rows([{"date": "2020-01-01", "value": "invalid"}])
    except ValueError as error:
        assert "not numeric" in str(error)
    else:
        raise AssertionError("Expected ValueError for a non-numeric value")


def test_normalizer_rejects_duplicate_dates() -> None:
    try:
        normalize_rows(
            [
                {"date": "2020-01-01", "value": "1"},
                {"date": "2020-01-01", "value": "2"},
            ]
        )
    except ValueError as error:
        assert "Duplicate date" in str(error)
    else:
        raise AssertionError("Expected ValueError for a duplicate date")
