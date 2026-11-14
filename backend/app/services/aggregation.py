"""Temporal aggregation and statistical trend analysis."""

from collections import defaultdict
from datetime import date
from math import isfinite

import numpy as np
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
            status="insufficient_data",
            slope_per_year=None,
            change_per_decade=None,
            p_value=None,
            confidence_interval_per_decade=None,
            significant=None,
            n_observations=len(annual),
            warnings=["Se necesitan al menos 3 años completos para estimar una tendencia."],
            message="Se necesitan al menos 3 años completos para estimar una tendencia.",
        )

    years = [float(year) for year, _ in annual]
    values = [value for _, value in annual]

    val_variance = float(np.var(values)) if len(values) > 0 else 0.0
    if val_variance == 0.0 or abs(val_variance) < 1e-12:
        return TrendResult(
            method="linear_regression_on_complete_annual_values",
            direction="no_linear_change",
            status="constant_series",
            slope_per_year=0.0,
            change_per_decade=0.0,
            p_value=None,
            confidence_interval_per_decade=None,
            significant=False,
            n_observations=len(annual),
            warnings=["La serie es constante: todos los valores observados son idénticos."],
            message="La serie es constante: no hay tendencia que evaluar.",
        )

    result = linregress(years, values)
    alpha = 0.05
    critical = float(t.ppf(1 - alpha / 2, len(annual) - 2))

    slope = float(result.slope) if np.isfinite(result.slope) else None
    stderr = float(result.stderr) if (result.stderr is not None and np.isfinite(result.stderr)) else None
    p_value = float(result.pvalue) if (result.pvalue is not None and np.isfinite(result.pvalue)) else None

    if slope is None or stderr is None or p_value is None:
        return TrendResult(
            method="linear_regression_on_complete_annual_values",
            direction="undetermined",
            status="calculation_error",
            slope_per_year=slope,
            change_per_decade=float(slope * 10) if slope is not None else None,
            p_value=None,
            confidence_interval_per_decade=None,
            significant=None,
            n_observations=len(annual),
            warnings=["No fue posible calcular el error estándar o la significancia."],
            message="Error numérico al calcular la tendencia.",
        )

    margin = critical * stderr
    direction = "increasing" if slope > 0 else "decreasing" if slope < 0 else "no_linear_change"
    significant = bool(p_value < alpha)
    ci_low = float((slope - margin) * 10)
    ci_high = float((slope + margin) * 10)
    ci = [ci_low, ci_high] if (np.isfinite(ci_low) and np.isfinite(ci_high)) else None

    return TrendResult(
        method="linear_regression_on_complete_annual_values",
        direction=direction,
        status="ok",
        slope_per_year=slope,
        change_per_decade=float(slope * 10),
        p_value=p_value,
        confidence_interval_per_decade=ci,
        significant=significant,
        n_observations=len(annual),
        warnings=[],
        message=(
            "La tendencia es estadísticamente significativa con α=0.05."
            if significant
            else "No hay evidencia suficiente para declarar una tendencia significativa con α=0.05."
        ),
    )
