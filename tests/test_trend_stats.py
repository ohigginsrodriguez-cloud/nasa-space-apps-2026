"""Comprehensive tests for pure statistical functions in trend_stats.py.

Includes cross-validation against pymannkendall, scipy.stats, and manual numpy formulas.
"""

from __future__ import annotations

import math
from calendar import monthrange
import numpy as np
import pymannkendall as pmk
import pytest
from scipy import stats

from app.catalog import VARIABLES
from app.schemas.analysis import Observation
from app.services.aggregation import aggregate_annual, analyze_trend
from app.services.trend_stats import (
    calculate_ols,
    compute_lag1_autocorrelation,
    compute_trend_line_and_bands,
    mann_kendall,
    seasonal_mann_kendall,
    sen_slope,
)


def test_mann_kendall_cross_validation_with_pymannkendall():
    """Verify our mann_kendall matches pymannkendall.original_test on varied series."""
    np.random.seed(42)
    # Series with trend and noise
    y1 = np.linspace(10, 20, 30) + np.random.normal(0, 0.5, 30)
    res_our = mann_kendall(y1)
    res_pmk = pmk.original_test(y1)

    assert res_our["status"] == "ok"
    assert res_our["s"] == res_pmk.s
    assert math.isclose(res_our["var_s"], res_pmk.var_s, rel_tol=1e-5)
    assert math.isclose(res_our["z"], res_pmk.z, rel_tol=1e-4)
    assert math.isclose(res_our["p_value"], res_pmk.p, rel_tol=1e-4)
    assert math.isclose(res_our["tau"], res_pmk.Tau, rel_tol=1e-5)
    assert res_our["trend"] == res_pmk.trend


def test_mann_kendall_with_ties_vs_pymannkendall():
    """Verify tie corrections match pymannkendall when ties are present."""
    y_ties = [10.0, 12.0, 12.0, 14.0, 14.0, 14.0, 16.0, 18.0, 18.0, 20.0]
    res_our = mann_kendall(y_ties)
    res_pmk = pmk.original_test(y_ties)

    assert res_our["s"] == res_pmk.s
    assert math.isclose(res_our["var_s"], res_pmk.var_s, rel_tol=1e-5)
    assert math.isclose(res_our["z"], res_pmk.z, rel_tol=1e-4)
    assert math.isclose(res_our["p_value"], res_pmk.p, rel_tol=1e-4)


def test_sen_slope_cross_validation_with_scipy():
    """Verify Sen's slope and IC match scipy.stats.theilslopes."""
    y = np.array([12.0, 13.5, 14.0, 16.2, 17.0, 19.5, 20.1])
    t = np.arange(len(y), dtype=float)

    our_sen = sen_slope(y, t, alpha=0.95)
    scipy_res = stats.theilslopes(y, t, alpha=0.95)

    assert math.isclose(our_sen["slope_per_year"], scipy_res.slope, rel_tol=1e-6)
    assert math.isclose(our_sen["intercept"], scipy_res.intercept, rel_tol=1e-6)
    assert math.isclose(our_sen["ci95_per_decade"][0], scipy_res.low_slope * 10.0, rel_tol=1e-5)
    assert math.isclose(our_sen["ci95_per_decade"][1], scipy_res.high_slope * 10.0, rel_tol=1e-5)


def test_ols_cross_validation_with_scipy_and_numpy():
    """Verify OLS matches linregress and manual closed-form math."""
    t = np.array([2000.0, 2001.0, 2002.0, 2003.0, 2004.0, 2005.0])
    y = np.array([15.1, 15.3, 15.2, 15.6, 15.8, 16.0])

    ols = calculate_ols(t, y, alpha=0.05)
    lr = stats.linregress(t, y)

    # Manual formulas
    t_mean, y_mean = np.mean(t), np.mean(y)
    beta_1 = np.sum((t - t_mean) * (y - y_mean)) / np.sum((t - t_mean) ** 2)
    beta_0 = y_mean - beta_1 * t_mean

    assert math.isclose(ols["slope_per_year"], beta_1, rel_tol=1e-6)
    assert math.isclose(ols["slope_per_year"], lr.slope, rel_tol=1e-6)
    assert math.isclose(ols["intercept"], beta_0, rel_tol=1e-6)
    assert math.isclose(ols["p_value"], lr.pvalue, rel_tol=1e-6)
    assert math.isclose(ols["r_squared"], lr.rvalue ** 2, rel_tol=1e-6)


def test_property_sign_inversion():
    """Inverting the sign of y should invert s, z, slope, and preserve p_value."""
    y = np.array([10.0, 12.5, 14.2, 17.0, 18.1, 21.0])
    t = np.arange(len(y), dtype=float)

    mk_pos = mann_kendall(y)
    mk_neg = mann_kendall(-y)
    assert mk_pos["s"] == -mk_neg["s"]
    assert math.isclose(mk_pos["z"], -mk_neg["z"], rel_tol=1e-6)
    assert math.isclose(mk_pos["p_value"], mk_neg["p_value"], rel_tol=1e-6)

    ols_pos = calculate_ols(t, y)
    ols_neg = calculate_ols(t, -y)
    assert math.isclose(ols_pos["slope_per_year"], -ols_neg["slope_per_year"], rel_tol=1e-6)
    assert math.isclose(ols_pos["p_value"], ols_neg["p_value"], rel_tol=1e-6)


def test_white_noise_series_not_significant():
    """White noise series should not be significant under MK or OLS."""
    np.random.seed(123)
    noise = np.random.normal(0, 1, 100)
    mk = mann_kendall(noise)
    assert mk["trend"] == "no_trend"
    assert mk["p_value"] > 0.05


def test_constant_series_handling():
    """Series with identical values should return constant_series without NaN."""
    const_y = np.full(15, 25.0)
    mk = mann_kendall(const_y)
    assert mk["status"] == "constant_series"
    assert mk["p_value"] is None

    ols = calculate_ols(np.arange(15), const_y)
    assert ols["status"] == "constant_series"
    assert ols["p_value"] is None
    assert ols["slope_per_year"] == 0.0


def test_insufficient_data_handling():
    """Series with n < 3 should report insufficient_data."""
    short_y = [10.0, 12.0]
    mk = mann_kendall(short_y)
    assert mk["status"] == "insufficient_data"

    ols = calculate_ols([1.0, 2.0], short_y)
    assert ols["status"] == "insufficient_data"


def test_series_with_negative_values():
    """Series with negative temperatures should be handled properly."""
    subzero = np.array([-15.0, -12.0, -10.0, -8.0, -5.0, -3.0])
    mk = mann_kendall(subzero)
    assert mk["trend"] == "increasing"
    assert mk["p_value"] < 0.05


def test_seasonal_mann_kendall():
    """Test Seasonal Mann-Kendall with artificial 5-year monthly warming."""
    monthly_data = []
    for yr in range(2010, 2016):
        for m in range(1, 13):
            # Monthly base + seasonal cycle + warming trend
            val = 10.0 + 5.0 * math.sin(2 * math.pi * m / 12) + 0.5 * (yr - 2010)
            monthly_data.append((yr, m, val))

    smk = seasonal_mann_kendall(monthly_data)
    assert smk["status"] == "ok"
    assert smk["trend"] == "increasing"
    assert smk["p_value"] < 0.05
    assert smk["seasons_evaluated"] == 12


def test_lag1_autocorrelation():
    """Positively correlated residuals should yield high r1."""
    # Strong positive autocorrelation e_t = 0.8 * e_{t-1} + noise
    np.random.seed(42)
    e = [0.0]
    for _ in range(50):
        e.append(0.8 * e[-1] + np.random.normal(0, 0.2))
    r1 = compute_lag1_autocorrelation(e)
    assert r1 is not None
    assert r1 > 0.5


def test_aggregate_annual_uses_only_complete_years_without_extrapolation():
    from datetime import date
    var_precip = VARIABLES["precipitation"]
    var_temp = VARIABLES["temperature"]

    # Incomplete year is excluded for both sum and mean variables.
    obs_10m = [
        Observation(date=date(2020, m, 1), value=10.0)
        for m in range(1, 11)
    ]
    assert aggregate_annual(obs_10m, var_precip) == []
    assert aggregate_annual(obs_10m, var_temp) == []
    complete_year = [
        Observation(date=date(2021, m, 1), value=10.0)
        for m in range(1, 13)
    ]
    assert aggregate_annual(complete_year, var_precip) == [(2021, 120.0)]
    assert aggregate_annual(complete_year, var_temp) == [(2021, 10.0)]

    varied_months = [
        Observation(date=date(2020, month, 1), value=float(month))
        for month in range(1, 13)
    ]
    expected_weighted_mean = sum(
        month * monthrange(2020, month)[1]
        for month in range(1, 13)
    ) / 366
    assert math.isclose(
        aggregate_annual(varied_months, var_temp)[0][1],
        expected_weighted_mean,
    )


def test_analyze_trend_returns_unified_schema_with_trend_line_and_bands():
    """Verify analyze_trend populates ols, mann_kendall, sen, trend_line, and trend_band."""
    from datetime import date
    var_temp = VARIABLES["temperature"]

    obs = [
        Observation(date=date(y, m, 1), value=15.0 + 0.1 * (y - 2000) + 2.0 * math.sin(m))
        for y in range(2000, 2025)
        for m in range(1, 13)
    ]
    res = analyze_trend(obs, var_temp, data_source="demo")

    assert res.status == "ok"
    assert res.significant is True
    assert res.direction == "increasing"
    assert res.data_source == "demo"
    assert res.ols is not None
    assert res.mann_kendall is not None
    assert res.sen is not None
    assert res.seasonal_mann_kendall is not None
    assert len(res.trend_line) == len(obs)
    assert len(res.trend_band) == len(obs)
    assert "date" in res.trend_line[0] and "value" in res.trend_line[0]
    assert "lower" in res.trend_band[0] and "upper" in res.trend_band[0]
    assert res.trend_band[0]["lower"] <= res.trend_band[0]["upper"]
