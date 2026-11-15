"""Temporal aggregation and statistical trend analysis."""

from __future__ import annotations

from calendar import monthrange
from collections import defaultdict
from datetime import date
from math import isfinite

import numpy as np

from app.catalog import Variable
from app.schemas.analysis import Observation, TrendResult
from app.services.trend_stats import (
    calculate_ols,
    compute_lag1_autocorrelation,
    compute_trend_line_and_bands,
    mann_kendall,
    seasonal_mann_kendall,
    sen_slope,
)


def aggregate_annual(
    series: list[Observation],
    variable: Variable,
) -> list[tuple[int, float]]:
    """Aggregate only complete calendar years; never extrapolate missing months."""
    grouped: dict[int, dict[int, float]] = defaultdict(dict)
    for item in series:
        if item.value is not None and isfinite(item.value):
            grouped[item.date.year][item.date.month] = item.value

    annual: list[tuple[int, float]] = []
    for year, months in sorted(grouped.items()):
        if len(months) < 12:
            continue
        if variable.aggregation == "sum":
            annual_value = sum(months.values())
        else:
            day_weights = {
                month: monthrange(year, month)[1]
                for month in months
            }
            annual_value = sum(
                value * day_weights[month] for month, value in months.items()
            ) / sum(day_weights.values())
        annual.append((year, annual_value))
    return annual


def analyze_trend(
    series: list[Observation],
    variable: Variable,
    data_source: str = "nasa_power",
) -> TrendResult:
    """Calculate comprehensive trend analysis (OLS, Mann-Kendall, Sen's slope, Seasonal MK)."""
    annual = aggregate_annual(series, variable)

    monthly_tuples = [
        (obs.date.year, obs.date.month, obs.value if obs.value is not None else float("nan"))
        for obs in series
    ]
    dates_str = [obs.date.isoformat() for obs in series]
    # Annual values are anchored at the middle of the calendar year.
    t_monthly = np.array([obs.date.year + (obs.date.month - 0.5) / 12.0 - 0.5 for obs in series], dtype=float)

    # Seasonal Mann-Kendall on monthly observations
    smk_res = seasonal_mann_kendall(monthly_tuples)
    month_counts: dict[int, set[int]] = defaultdict(set)
    for obs in series:
        if obs.value is not None and isfinite(obs.value):
            month_counts[obs.date.year].add(obs.date.month)
    incomplete_year_warning = (
        "Se excluyeron del ajuste anual los años con meses faltantes para evitar "
        "extrapolaciones y sesgo estacional; revisa la cobertura del periodo."
        if any(len(months) < 12 for months in month_counts.values())
        else None
    )

    if len(annual) < 3:
        insufficient_warnings = [
            "Se necesitan al menos 3 años calendario con 12 meses válidos para estimar una tendencia."
        ]
        if incomplete_year_warning:
            insufficient_warnings.append(incomplete_year_warning)
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
            warnings=insufficient_warnings,
            message="Se necesitan al menos 3 años calendario completos para estimar una tendencia.",
            ols=None,
            mann_kendall=None,
            seasonal_mann_kendall=smk_res,
            sen=None,
            trend_line=[],
            trend_band=[],
            alpha=0.05,
            data_source=data_source,
            analysis_method="annual_values",
        )

    years = np.array([float(year) for year, _ in annual], dtype=float)
    values = np.array([float(value) for _, value in annual], dtype=float)

    # OLS, Mann-Kendall, Sen's slope
    ols_res = calculate_ols(years, values, alpha=0.05)
    mk_res = mann_kendall(values, alpha=0.05)
    sen_res = sen_slope(values, years, alpha=0.95)

    warnings: list[str] = []
    if incomplete_year_warning:
        warnings.append(incomplete_year_warning)

    # Check for constant series
    if ols_res.get("status") == "constant_series" or mk_res.get("status") == "constant_series":
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
            warnings=warnings + ["Los agregados anuales son constantes; los meses pueden tener variación estacional."],
            message="La serie anual es constante: no hay tendencia anual que evaluar.",
            ols=ols_res,
            mann_kendall=mk_res,
            seasonal_mann_kendall=smk_res,
            sen=sen_res,
            trend_line=[{"date": d, "value": round(float(np.mean(values)), 4)} for d in dates_str],
            trend_band=[],
            alpha=0.05,
            data_source=data_source,
            analysis_method="annual_values",
        )

    slope = ols_res.get("slope_per_year")
    intercept = ols_res.get("intercept")
    p_value = ols_res.get("p_value")
    ci_decade = ols_res.get("ci95_per_decade")
    alpha = 0.05

    if slope is None or p_value is None or intercept is None:
        return TrendResult(
            method="linear_regression_on_complete_annual_values",
            direction="undetermined",
            status="calculation_error",
            slope_per_year=slope,
            change_per_decade=slope * 10.0 if slope is not None else None,
            p_value=None,
            confidence_interval_per_decade=None,
            significant=None,
            n_observations=len(annual),
            warnings=["No fue posible calcular el error estándar o la significancia."],
            message="Error numérico al calcular la tendencia.",
            ols=ols_res,
            mann_kendall=mk_res,
            seasonal_mann_kendall=smk_res,
            sen=sen_res,
            trend_line=[],
            trend_band=[],
            alpha=0.05,
            data_source=data_source,
            analysis_method="annual_values",
        )

    # 1. Statistical warning: Small sample size
    if len(annual) < 10:
        warnings.append(
            f"Pocos años analizados (n={len(annual)}): la prueba estadística tiene baja potencia; "
            "se recomienda ampliar el periodo a ≥ 20 años."
        )

    # 2. Residual lag-1 autocorrelation
    y_pred = intercept + slope * years
    residuals = values - y_pred
    r1 = compute_lag1_autocorrelation(residuals)
    if r1 is not None and abs(r1) > 0.30:
        warnings.append(
            f"Autocorrelación residual moderada/alta (|r1| = {abs(r1):.2f} > 0.30). "
            "La independencia de los residuos no está garantizada: el p-value y el IC de OLS "
            "pueden ser poco fiables; la autocorrelación positiva puede exagerar la significancia."
        )

    # 3. Discrepancy between OLS and Mann-Kendall
    ols_sig = bool(p_value < alpha)
    mk_p = mk_res.get("p_value")
    mk_sig = bool(mk_p is not None and mk_p < alpha)
    if ols_sig != mk_sig and mk_p is not None:
        warnings.append(
            f"Discrepancia entre métodos: OLS ({'significativo' if ols_sig else 'no significativo'}, p={p_value:.4f}) "
            f"y Mann-Kendall ({'significativo' if mk_sig else 'no significativo'}, p={mk_p:.4f}) difieren en significancia (α=0.05)."
        )

    # Compute trend line and confidence bands over monthly dates
    n = len(years)
    df = n - 2
    sum_res_sq = float(np.sum(residuals**2))
    stderr_res = float(np.sqrt(sum_res_sq / df)) if df > 0 else 0.0
    t_mean = float(np.mean(years))
    sum_t_diff_sq = float(np.sum((years - t_mean) ** 2))

    trend_line, trend_band = compute_trend_line_and_bands(
        dates=dates_str,
        t_vals=t_monthly,
        slope=slope,
        intercept=intercept,
        stderr_res=stderr_res,
        t_mean=t_mean,
        sum_t_diff_sq=sum_t_diff_sq,
        n=n,
        alpha=alpha,
    )

    direction = "increasing" if slope > 0 else "decreasing" if slope < 0 else "no_linear_change"
    significant = ols_sig

    return TrendResult(
        method="linear_regression_on_complete_annual_values",
        direction=direction,
        status="ok",
        slope_per_year=slope,
        change_per_decade=float(slope * 10.0),
        p_value=p_value,
        confidence_interval_per_decade=ci_decade,
        significant=significant,
        n_observations=len(annual),
        warnings=warnings,
        message=(
            "La tendencia es estadísticamente significativa con α=0.05."
            if significant
            else "No hay evidencia suficiente para declarar una tendencia significativa con α=0.05."
        ),
        ols=ols_res,
        mann_kendall=mk_res,
        seasonal_mann_kendall=smk_res,
        sen=sen_res,
        trend_line=trend_line,
        trend_band=trend_band,
        alpha=alpha,
        data_source=data_source,
        analysis_method="annual_values",
    )
