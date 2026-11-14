"""Pure statistical functions for time series trend analysis.

Implements:
- Ordinary Least Squares (OLS) linear regression with confidence bands
- Mann-Kendall non-parametric trend test (with tie corrections)
- Seasonal Mann-Kendall test (Hirsch et al., 1982)
- Theil-Sen median slope estimator with confidence interval
- Monthly climatology and anomaly series computation
- Lag-1 residual autocorrelation check
"""

from __future__ import annotations

import math
from typing import Any

import numpy as np
from scipy import stats


def calculate_ols(
    t: np.ndarray,
    y: np.ndarray,
    alpha: float = 0.05,
) -> dict[str, Any]:
    """Calculate OLS linear regression of y on t with confidence interval."""
    t = np.asarray(t, dtype=float)
    y = np.asarray(y, dtype=float)
    mask = np.isfinite(t) & np.isfinite(y)
    t = t[mask]
    y = y[mask]
    n = len(y)

    if n < 3:
        return {"status": "insufficient_data", "n": n}

    var_y = float(np.var(y))
    if var_y == 0.0 or abs(var_y) < 1e-14:
        return {
            "status": "constant_series",
            "slope_per_year": 0.0,
            "slope_per_decade": 0.0,
            "intercept": float(np.mean(y)),
            "r_squared": 0.0,
            "p_value": None,
            "ci95_per_decade": None,
            "t_stat": None,
            "df": n - 2,
            "stderr": 0.0,
            "n": n,
        }

    lr = stats.linregress(t, y)
    slope = float(lr.slope) if np.isfinite(lr.slope) else None
    intercept = float(lr.intercept) if np.isfinite(lr.intercept) else None
    stderr = float(lr.stderr) if (lr.stderr is not None and np.isfinite(lr.stderr)) else None
    p_value = float(lr.pvalue) if (lr.pvalue is not None and np.isfinite(lr.pvalue)) else None
    r_squared = float(lr.rvalue**2) if np.isfinite(lr.rvalue) else None

    if slope is None or stderr is None or p_value is None:
        return {"status": "calculation_error", "n": n}

    df = n - 2
    critical_t = float(stats.t.ppf(1 - alpha / 2, df))
    margin = critical_t * stderr
    t_stat = slope / stderr if stderr > 0 else 0.0

    ci_low = float((slope - margin) * 10)
    ci_high = float((slope + margin) * 10)
    ci_decade = [ci_low, ci_high] if (np.isfinite(ci_low) and np.isfinite(ci_high)) else None

    return {
        "status": "ok",
        "slope_per_year": slope,
        "slope_per_decade": slope * 10.0,
        "intercept": intercept,
        "r_squared": r_squared,
        "p_value": p_value,
        "ci95_per_decade": ci_decade,
        "t_stat": float(t_stat),
        "df": df,
        "stderr": stderr,
        "n": n,
    }


def mann_kendall(y: list[float] | np.ndarray, alpha: float = 0.05) -> dict[str, Any]:
    """Mann-Kendall non-parametric trend test with tie correction."""
    x = np.asarray(y, dtype=float)
    x = x[np.isfinite(x)]
    n = len(x)

    if n < 3:
        return {
            "status": "insufficient_data",
            "s": None,
            "var_s": None,
            "z": None,
            "p_value": None,
            "tau": None,
            "trend": "undetermined",
        }

    # S statistic: sum of signs of pairwise differences
    diffs = x[None, :] - x[:, None]
    s = int(np.sum(np.sign(diffs)[np.triu_indices(n, 1)]))

    # Tie correction
    _, counts = np.unique(x, return_counts=True)
    var_s = (n * (n - 1) * (2 * n + 5) - np.sum(counts * (counts - 1) * (2 * counts + 5))) / 18.0

    if var_s <= 0 or not np.isfinite(var_s):
        return {
            "status": "constant_series",
            "s": s,
            "var_s": 0.0,
            "z": 0.0,
            "p_value": None,
            "tau": 0.0,
            "trend": "no_trend",
        }

    if s > 0:
        z = (s - 1) / math.sqrt(var_s)
    elif s < 0:
        z = (s + 1) / math.sqrt(var_s)
    else:
        z = 0.0

    p_value = 2.0 * (1.0 - stats.norm.cdf(abs(z)))
    denom = (n * (n - 1)) / 2.0
    tau = s / denom if denom > 0 else 0.0

    if p_value < alpha and z > 0:
        trend = "increasing"
    elif p_value < alpha and z < 0:
        trend = "decreasing"
    else:
        trend = "no_trend"

    return {
        "status": "ok",
        "s": s,
        "var_s": float(var_s),
        "z": float(z),
        "p_value": float(p_value),
        "tau": float(tau),
        "trend": trend,
    }


def seasonal_mann_kendall(
    monthly_series: list[tuple[int, int, float]],
    alpha: float = 0.05,
) -> dict[str, Any]:
    """Seasonal Mann-Kendall test (Hirsch, Slack & Smith, 1982).

    Parameters:
        monthly_series: list of (year, month, value) tuples.
        alpha: significance level.
    """
    by_month: dict[int, list[tuple[int, float]]] = {m: [] for m in range(1, 13)}
    for year, month, val in monthly_series:
        if val is not None and np.isfinite(val):
            by_month[month].append((year, float(val)))

    s_total = 0
    var_total = 0.0
    valid_seasons = 0

    for m in range(1, 13):
        entries = sorted(by_month[m], key=lambda item: item[0])
        vals = [v for _, v in entries]
        n_m = len(vals)
        if n_m < 3:
            continue
        valid_seasons += 1
        x = np.asarray(vals, dtype=float)
        diffs = x[None, :] - x[:, None]
        s_m = int(np.sum(np.sign(diffs)[np.triu_indices(n_m, 1)]))
        _, counts = np.unique(x, return_counts=True)
        var_s_m = (n_m * (n_m - 1) * (2 * n_m + 5) - np.sum(counts * (counts - 1) * (2 * counts + 5))) / 18.0
        s_total += s_m
        var_total += max(var_s_m, 0.0)

    if valid_seasons == 0 or var_total <= 0:
        return {
            "status": "insufficient_data" if valid_seasons == 0 else "constant_series",
            "s": s_total,
            "var_s": float(var_total),
            "z": None,
            "p_value": None,
            "trend": "undetermined",
        }

    if s_total > 0:
        z = (s_total - 1) / math.sqrt(var_total)
    elif s_total < 0:
        z = (s_total + 1) / math.sqrt(var_total)
    else:
        z = 0.0

    p_value = 2.0 * (1.0 - stats.norm.cdf(abs(z)))
    trend = "increasing" if (p_value < alpha and z > 0) else "decreasing" if (p_value < alpha and z < 0) else "no_trend"

    return {
        "status": "ok",
        "s": s_total,
        "var_s": float(var_total),
        "z": float(z),
        "p_value": float(p_value),
        "trend": trend,
        "seasons_evaluated": valid_seasons,
    }


def sen_slope(
    y: list[float] | np.ndarray,
    t: list[float] | np.ndarray | None = None,
    alpha: float = 0.95,
) -> dict[str, Any]:
    """Calculate Theil-Sen estimator with confidence interval using scipy."""
    y_arr = np.asarray(y, dtype=float)
    if t is None:
        t_arr = np.arange(len(y_arr), dtype=float)
    else:
        t_arr = np.asarray(t, dtype=float)

    mask = np.isfinite(y_arr) & np.isfinite(t_arr)
    y_arr = y_arr[mask]
    t_arr = t_arr[mask]
    n = len(y_arr)

    if n < 3:
        return {
            "status": "insufficient_data",
            "slope_per_year": None,
            "slope_per_decade": None,
            "intercept": None,
            "ci95_per_decade": None,
        }

    var_y = float(np.var(y_arr))
    if var_y == 0.0 or abs(var_y) < 1e-14:
        return {
            "status": "constant_series",
            "slope_per_year": 0.0,
            "slope_per_decade": 0.0,
            "intercept": float(np.mean(y_arr)),
            "ci95_per_decade": None,
        }

    res = stats.theilslopes(y_arr, t_arr, alpha=alpha)
    slope = float(res.slope) if np.isfinite(res.slope) else None
    intercept = float(res.intercept) if np.isfinite(res.intercept) else None
    low = float(res.low_slope) if np.isfinite(res.low_slope) else None
    high = float(res.high_slope) if np.isfinite(res.high_slope) else None

    ci_decade = [low * 10.0, high * 10.0] if (low is not None and high is not None) else None

    return {
        "status": "ok",
        "slope_per_year": slope,
        "slope_per_decade": slope * 10.0 if slope is not None else None,
        "intercept": intercept,
        "ci95_per_decade": ci_decade,
    }


def compute_climatology_and_anomalies(
    monthly_series: list[tuple[int, int, float]],
) -> tuple[dict[int, float], list[tuple[int, int, float]]]:
    """Compute monthly climatology (mean per calendar month) and monthly anomalies."""
    by_month: dict[int, list[float]] = {m: [] for m in range(1, 13)}
    for _, month, val in monthly_series:
        if val is not None and np.isfinite(val):
            by_month[month].append(float(val))

    climatology = {
        m: float(np.mean(vals)) if len(vals) > 0 else 0.0
        for m, vals in by_month.items()
    }

    anomalies: list[tuple[int, int, float]] = []
    for year, month, val in monthly_series:
        if val is not None and np.isfinite(val):
            anomalies.append((year, month, float(val) - climatology[month]))

    return climatology, anomalies


def compute_lag1_autocorrelation(residuals: list[float] | np.ndarray) -> float | None:
    """Calculate lag-1 autocorrelation r1 of regression residuals."""
    res = np.asarray(residuals, dtype=float)
    res = res[np.isfinite(res)]
    n = len(res)
    if n < 4:
        return None
    res_mean = np.mean(res)
    res_dev = res - res_mean
    var_res = np.sum(res_dev**2)
    if var_res <= 0:
        return 0.0
    cov = np.sum(res_dev[:-1] * res_dev[1:])
    r1 = float(cov / var_res)
    return r1 if np.isfinite(r1) else None


def compute_trend_line_and_bands(
    dates: list[str],
    t_vals: np.ndarray,
    slope: float,
    intercept: float,
    stderr_res: float,
    t_mean: float,
    sum_t_diff_sq: float,
    n: int,
    alpha: float = 0.05,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Compute fitted trend values and 95% confidence bands for mean regression."""
    if n < 3 or not np.isfinite(slope) or not np.isfinite(intercept):
        return [], []

    df = n - 2
    critical_t = float(stats.t.ppf(1 - alpha / 2, df)) if df > 0 else 1.96

    trend_line = []
    trend_band = []

    for d_str, t in zip(dates, t_vals):
        y_hat = float(intercept + slope * t)
        if sum_t_diff_sq > 0 and stderr_res > 0:
            se_mean = stderr_res * math.sqrt(1.0 / n + ((t - t_mean) ** 2) / sum_t_diff_sq)
            margin = critical_t * se_mean
            lower = y_hat - margin
            upper = y_hat + margin
        else:
            lower = y_hat
            upper = y_hat

        trend_line.append({"date": d_str, "value": round(y_hat, 4)})
        trend_band.append({
            "date": d_str,
            "lower": round(lower, 4),
            "upper": round(upper, 4),
        })

    return trend_line, trend_band
