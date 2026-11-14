"""Temporal aggregation and statistical trend analysis."""

from collections import defaultdict
from datetime import date
from math import isfinite

from scipy.stats import linregress, t

from app.catalog import Variable
from app.schemas.analysis import Observation, TrendResult


def aggregate_annual(
    series: list[Observation],
    variable: Variable,
) -> list[tuple[int, float]]:
    """Aggregate monthly values into complete calendar years per variable."""
    grouped: dict[int, dict[int, float]] = defaultdict(dict)
    for item in series:
        if item.value is not None and isfinite(item.value):
            grouped[item.date.year][item.date.month] = item.value

    annual: list[tuple[int, float]] = []
    for year, months in sorted(grouped.items()):
        # Require each calendar month exactly once; do not treat duplicates or
        # twelve arbitrary observations as a complete annual record.
        if set(months) != set(range(1, 13)):
            continue
        values = list(months.values())
        if variable.aggregation == "sum":
            annual_value = sum(values)
        else:
            annual_value = sum(values) / len(values)
        annual.append((year, annual_value))
    return annual


def analyze_trend(series: list[Observation], variable: Variable) -> TrendResult:
    """Calculate a linear trend on complete annual aggregates when possible."""
    annual = aggregate_annual(series, variable)
    if len(annual) < 3:
        return TrendResult(
            method="linear_regression_on_complete_annual_values",
            direction="undetermined",
            slope_per_year=None,
            change_per_decade=None,
            p_value=None,
            confidence_interval_per_decade=None,
            significant=None,
            n_observations=len(annual),
            message="Se necesitan al menos 3 años completos para estimar una tendencia.",
        )

    years = [float(year) for year, _ in annual]
    values = [value for _, value in annual]
    result = linregress(years, values)
    alpha = 0.05
    critical = float(t.ppf(1 - alpha / 2, len(annual) - 2))
    margin = critical * result.stderr
    p_value = float(result.pvalue)
    direction = "increasing" if result.slope > 0 else "decreasing" if result.slope < 0 else "no_linear_change"
    return TrendResult(
        method="linear_regression_on_complete_annual_values",
        direction=direction,
        slope_per_year=float(result.slope),
        change_per_decade=float(result.slope * 10),
        p_value=p_value,
        confidence_interval_per_decade=[
            float((result.slope - margin) * 10),
            float((result.slope + margin) * 10),
        ],
        significant=p_value < alpha,
        n_observations=len(annual),
        message=(
            "La tendencia es estadísticamente significativa con α=0.05."
            if p_value < alpha
            else "No hay evidencia suficiente para declarar una tendencia significativa con α=0.05."
        ),
    )
