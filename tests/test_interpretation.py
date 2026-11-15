from app.services.interpretation import physical_processes, spatial_divergence, statistical_verdict


def _result(variable_id, direction, significant, p=0.01):
    return {
        "variable": {
            "id": variable_id,
            "name": variable_id,
            "unit": "unit",
        },
        "trend": {
            "status": "ok",
            "direction": direction,
            "significant": significant,
            "change_per_decade": 1 if direction == "increasing" else -1,
            "p_value": p,
            "alpha": 0.05,
            "confidence_interval_per_decade": [0.2, 1.8] if direction == "increasing" else [-1.8, -0.2],
            "mann_kendall": {"p_value": p},
            "warnings": [],
        },
    }


def test_verdict_requires_p_value_and_interval_to_agree():
    result = _result("temperature", "increasing", True)
    result["trend"]["confidence_interval_per_decade"] = [-0.1, 1.8]
    verdict = statistical_verdict(result["variable"], result["trend"])
    assert verdict["status"] == "conflicting_evidence"
    assert verdict["significant"] is None


def test_constant_series_gets_stationary_verdict_not_insufficient_data():
    variable = {"id": "temperature", "name": "Temperature", "unit": "°C"}
    trend = {
        "status": "constant_series",
        "direction": "no_linear_change",
        "significant": False,
        "p_value": None,
        "confidence_interval_per_decade": None,
        "warnings": [],
    }
    assert statistical_verdict(variable, trend)["status"] == "stationary"


def test_physical_pattern_requires_significant_opposing_variables():
    temperature = _result("temperature", "increasing", True)
    soil = _result("soil_moisture", "decreasing", True)
    assert physical_processes([temperature, soil])["processes"][0]["id"] == "heat_drying"
    soil["trend"]["significant"] = False
    assert physical_processes([temperature, soil])["processes"] == []


def test_spatial_divergence_distinguishes_mixed_significance():
    variable = {"id": "precipitation", "name": "Precipitación", "unit": "mm"}
    regions = [
        {"region": {"id": "north", "name": "Norte"}, "trend": _result("precipitation", "increasing", True)["trend"]},
        {"region": {"id": "south", "name": "Sureste"}, "trend": _result("precipitation", "decreasing", False)["trend"]},
    ]
    assert spatial_divergence(variable, regions)["status"] == "opposite_directions_mixed_significance"
