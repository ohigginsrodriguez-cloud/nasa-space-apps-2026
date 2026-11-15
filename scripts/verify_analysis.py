#!/usr/bin/env python3
"""Scientific verification script: validates OLS, Mann-Kendall, and Theil-Sen

against scipy.stats and pymannkendall with real NASA POWER time series.
Ensures deviations in slope and p-values are strictly within numerical precision (< 1e-6).
"""

from __future__ import annotations

from datetime import date
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

import numpy as np
import pymannkendall as pmk
from scipy import stats

from app.catalog import VARIABLES
from app.regions import PREDEFINED_REGIONS
from app.services.aggregation import aggregate_annual, analyze_trend
from app.services.providers.nasa_power import NasaPowerProvider
from app.services.trend_stats import calculate_ols, mann_kendall, sen_slope


def run_benchmark():
    print("=" * 80)
    print("EARTH SYSTEM TREND DETECTIVE — SCIENTIFIC BENCHMARK & NUMERICAL VALIDATION")
    print("=" * 80)

    provider = NasaPowerProvider()
    test_cases = [
        ("Desierto de Sonora", PREDEFINED_REGIONS["sonoran-desert"], VARIABLES["temperature"], "temperature"),
        ("Selva Lacandona", PREDEFINED_REGIONS["lacandon-jungle"], VARIABLES["precipitation"], "precipitation"),
    ]

    start = date(1991, 1, 1)
    end = date(2023, 12, 31)

    all_passed = True

    for name, region, var, var_key in test_cases:
        print(f"\n[Analizando {name} · {var.name} ({start.year}–{end.year})]")
        try:
            series = provider.get_series(var, region, start, end)
        except Exception as e:
            print(f"Error fetching data: {e}")
            all_passed = False
            continue

        annual = aggregate_annual(series, var)
        years = np.array([float(y) for y, _ in annual], dtype=float)
        values = np.array([float(v) for _, v in annual], dtype=float)

        print(f"  Observaciones mensuales: {len(series)} | Años analizados: {len(annual)}")

        # 1. OLS vs scipy.stats.linregress
        our_ols = calculate_ols(years, values)
        scipy_lr = stats.linregress(years, values)

        diff_slope_ols = abs(our_ols["slope_per_year"] - scipy_lr.slope)
        diff_p_ols = abs(our_ols["p_value"] - scipy_lr.pvalue)

        # 2. Mann-Kendall vs pymannkendall.original_test
        our_mk = mann_kendall(values)
        pmk_res = pmk.original_test(values)

        diff_s = abs(our_mk["s"] - pmk_res.s)
        diff_p_mk = abs(our_mk["p_value"] - pmk_res.p)
        diff_z = abs(our_mk["z"] - pmk_res.z)

        # 3. Sen vs scipy.stats.theilslopes
        our_sen = sen_slope(values, years)
        scipy_sen = stats.theilslopes(values, years, alpha=0.95)

        diff_slope_sen = abs(our_sen["slope_per_year"] - scipy_sen.slope)

        # Print comparison table
        print("\n  Métrica                   | Implementación  | Referencia Scipy/PMK | Diferencia  | Estado")
        print("  " + "-" * 75)

        row_format = "  {:<25} | {:<15.6f} | {:<20.6f} | {:<11.2e} | {}"
        row_int = "  {:<25} | {:<15} | {:<20} | {:<11} | {}"

        # OLS Slope
        st = "✅ EXACTO" if diff_slope_ols < 1e-6 else "❌ DESVIACIÓN"
        print(row_format.format("OLS Pendiente (anual)", our_ols["slope_per_year"], scipy_lr.slope, diff_slope_ols, st))

        # OLS p-value
        st = "✅ EXACTO" if diff_p_ols < 1e-6 else "❌ DESVIACIÓN"
        print(row_format.format("OLS p-value", our_ols["p_value"], scipy_lr.pvalue, diff_p_ols, st))

        # Mann-Kendall S
        st = "✅ EXACTO" if diff_s == 0 else "❌ DESVIACIÓN"
        print(row_int.format("Mann-Kendall S", our_mk["s"], pmk_res.s, diff_s, st))

        # Mann-Kendall Z
        st = "✅ EXACTO" if diff_z < 1e-4 else "❌ DESVIACIÓN"
        print(row_format.format("Mann-Kendall Z", our_mk["z"], pmk_res.z, diff_z, st))

        # Mann-Kendall p-value
        st = "✅ EXACTO" if diff_p_mk < 1e-4 else "❌ DESVIACIÓN"
        print(row_format.format("Mann-Kendall p-value", our_mk["p_value"], pmk_res.p, diff_p_mk, st))

        # Sen Slope
        st = "✅ EXACTO" if diff_slope_sen < 1e-6 else "❌ DESVIACIÓN"
        print(row_format.format("Sen Pendiente (anual)", our_sen["slope_per_year"], scipy_sen.slope, diff_slope_sen, st))

        # Full analyze_trend pipeline check
        full_trend = analyze_trend(series, var)
        print(f"\n  Resumen Científico:")
        print(f"  • Dirección detectada: {full_trend.direction}")
        print(f"  • Cambio por década: {full_trend.change_per_decade:+.3f} {var.unit}/década")
        print(f"  • IC 95%: [{full_trend.confidence_interval_per_decade[0]:.3f}, {full_trend.confidence_interval_per_decade[1]:.3f}] {var.unit}/década")
        print(f"  • Significativo (α=0.05): {'SÍ' if full_trend.significant else 'NO'}")
        if full_trend.warnings:
            for w in full_trend.warnings:
                print(f"  • Advertencia: {w}")

        if any(not np.isfinite(diff) or diff >= 1e-6 for diff in (
            diff_slope_ols, diff_p_ols, diff_slope_sen, diff_s, diff_p_mk, diff_z,
        )):
            all_passed = False

    print("\n" + "=" * 80)
    if all_passed:
        print("RESULTADO GLOBAL: TODAS LAS PRUEBAS NUMÉRICAS SON RIGUROSAS Y EXACTAS (< 1e-6).")
    else:
        print("RESULTADO GLOBAL: ALGUNAS DESVIACIONES SUPERARON EL UMBRAL.")
    print("=" * 80)
    return all_passed


if __name__ == "__main__":
    sys.exit(0 if run_benchmark() else 1)
