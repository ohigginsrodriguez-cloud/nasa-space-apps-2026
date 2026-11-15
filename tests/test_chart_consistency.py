from datetime import date

import pytest

from app.catalog import VARIABLES
from app.schemas.analysis import Observation
from app.services.aggregation import analyze_trend


def test_monthly_trend_is_centered_on_annual_aggregate():
    series = [Observation(date=date(y, m, 1), value=10 + (y - 2000))
              for y in range(2000, 2020) for m in range(1, 13)]
    result = analyze_trend(series, VARIABLES["temperature"])
    assert result.analysis_method == "annual_values"
    values = [item["value"] for item in result.trend_line[:12]]
    assert sum(values) / 12 == pytest.approx(10, abs=1e-4)


def test_incomplete_years_expose_approximation_warning():
    series = [Observation(date=date(y, m, 1), value=y - 2000 + m)
              for y in range(2000, 2020) for m in range(1, 11)]
    result = analyze_trend(series, VARIABLES["precipitation"])
    assert result.n_observations == 20
    assert any("sesgo estacional" in warning for warning in result.warnings)
