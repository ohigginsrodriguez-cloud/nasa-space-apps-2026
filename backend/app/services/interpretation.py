"""Rule-based, non-causal summaries of already calculated trend statistics."""

from __future__ import annotations

from typing import Any


def statistical_verdict(variable: dict[str, Any], trend: dict[str, Any]) -> dict[str, Any]:
    """Build a concise verdict, requiring agreement between OLS p and its CI."""
    alpha = float(trend.get("alpha") or 0.05)
    p_value = trend.get("p_value")
    interval = trend.get("confidence_interval_per_decade")
    direction = trend.get("direction", "undetermined")
    slope = trend.get("change_per_decade")
    status = trend.get("status", "ok")
    warnings = list(trend.get("warnings") or [])

    if status == "constant_series" or direction == "no_linear_change":
        verdict = "stationary"
        significant = False
        summary = "The annual series shows no linear change; this does not rule out monthly variation."
    elif status in {"insufficient_data", "calculation_error"} or p_value is None or not interval:
        verdict = "insufficient_data"
        significant = None
        summary = "There is not enough data to evaluate the trend."
    else:
        contains_zero = interval[0] <= 0 <= interval[1]
        significant_by_p = p_value < alpha
        significant_by_ci = not contains_zero
        if significant_by_p != significant_by_ci:
            verdict = "conflicting_evidence"
            significant = None
            summary = "The p-value and confidence interval disagree; interpret the result cautiously."
        elif significant_by_p:
            significant = True
            verdict = "significant_increase" if direction == "increasing" else "significant_decrease"
            verb = "increased" if direction == "increasing" else "decreased"
            summary = (
                f"{variable['name']} {verb} {abs(float(slope)):.3g} "
                f"{variable['unit']} per decade; the trend is statistically significant."
            )
        else:
            significant = False
            verdict = "non_significant"
            summary = "The slope indicates a direction, but the evidence does not reach statistical significance."

    return {
        "title": {
            "significant_increase": "Significant increase",
            "significant_decrease": "Significant decrease",
            "non_significant": "Not significant",
            "stationary": "No linear change detected",
            "insufficient_data": "Trend not evaluable",
            "conflicting_evidence": "Conflicting statistical evidence",
        }[verdict],
        "status": verdict,
        "summary": summary,
        "direction": direction,
        "significant": significant,
        "change_per_decade": slope,
        "unit": variable["unit"],
        "alpha": alpha,
        "p_values": {
            "ols": p_value,
            "mann_kendall": (trend.get("mann_kendall") or {}).get("p_value"),
        },
        "confidence_interval": {
            "level": 0.95,
            "lower": interval[0] if interval else None,
            "upper": interval[1] if interval else None,
            "contains_zero": interval[0] <= 0 <= interval[1] if interval else None,
        },
        "warnings": warnings,
        "causality_warning": "Statistical association does not demonstrate causality.",
    }


def physical_processes(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Detect exploratory physical patterns only from significant directions."""
    by_id = {item["variable"]["id"]: item for item in results}
    selected_variables = [
        {
            "id": item["variable"]["id"],
            "name": item["variable"]["name"],
            "unit": item["variable"]["unit"],
            "direction": item["trend"].get("direction"),
            "significant": (item.get("interpretation") or {}).get(
                "significant", item["trend"].get("significant")
            ),
        }
        for item in results
    ]

    def supports(variable_id: str, direction: str) -> bool:
        item = by_id.get(variable_id)
        if not item:
            return False
        trend = item["trend"]
        significant = (item.get("interpretation") or {}).get(
            "significant", trend.get("significant")
        )
        return significant is True and trend.get("direction") == direction

    candidates = [
        (
            "heat_drying",
            "Pattern compatible with heat-driven drying",
            "Temperature increases while soil moisture decreases.",
            {"temperature": "increasing", "soil_moisture": "decreasing"},
        ),
        (
            "water_stress",
            "Pattern compatible with water stress",
            "Precipitation and soil moisture decrease; this is compatible with drier conditions.",
            {"precipitation": "decreasing", "soil_moisture": "decreasing"},
        ),
        (
            "warm_dry_air",
            "Pattern compatible with warmer, drier air",
            "Temperature increases while relative humidity decreases.",
            {"temperature": "increasing", "relative_humidity": "decreasing"},
        ),
    ]
    processes = []
    for process_id, name, summary, requirements in candidates:
        if all(supports(variable_id, direction) for variable_id, direction in requirements.items()):
            processes.append({
                "id": process_id,
                "name": name,
                "summary": summary,
                "variables": list(requirements),
                "evidence": {
                    variable_id: {
                        "direction": by_id[variable_id]["trend"].get("direction"),
                        "significant": (by_id[variable_id].get("interpretation") or {}).get(
                            "significant", by_id[variable_id]["trend"].get("significant")
                        ),
                        "p_value_ols": by_id[variable_id]["trend"].get("p_value"),
                        "confidence_interval_per_decade": by_id[variable_id]["trend"].get(
                            "confidence_interval_per_decade"
                        ),
                    }
                    for variable_id in requirements
                },
                "confidence": "exploratory",
                "causality_warning": "This pattern does not identify causes or demonstrate that one variable drives another.",
            })
    return {
        "title": "Earth system interaction pattern detected" if processes else "No conclusive multivariable pattern",
        "processes": processes,
        "selected_variables": selected_variables,
        "summary": (
            f"{len(selected_variables)} variables were analyzed together: "
            f"{', '.join(item['name'] for item in selected_variables)}. "
            "Each variable retains its unit and its own statistical verdict."
        ),
        "pattern_summary": (
            "Compatible patterns were found; these are exploratory hypotheses based on significant trends."
            if processes
            else "No predefined combination of significant trends was found."
        ),
        "causality_warning": "Matching trends do not demonstrate causality or a physical mechanism.",
    }


def spatial_divergence(
    variable: dict[str, Any],
    region_results: list[dict[str, Any]],
) -> dict[str, Any]:
    """Compare a variable's trend direction across two analyzed regions."""
    if len(region_results) != 2:
        return {"status": "no_evaluable", "summary": "Exactly two regions are required."}

    left, right = region_results
    trend_a, trend_b = left["trend"], right["trend"]
    direction_a, direction_b = trend_a.get("direction"), trend_b.get("direction")
    evaluable = all(
        trend.get("status") not in {"insufficient_data", "calculation_error"}
        and trend.get("change_per_decade") is not None
        for trend in (trend_a, trend_b)
    )
    if not evaluable:
        status = "insufficient_data"
        summary = "There is not enough data to compare the trends in both regions."
    elif direction_a in {"increasing", "decreasing"} and direction_b in {"increasing", "decreasing"} and direction_a != direction_b:
        significant_a = (left.get("interpretation") or {}).get(
            "significant", trend_a.get("significant")
        )
        significant_b = (right.get("interpretation") or {}).get(
            "significant", trend_b.get("significant")
        )
        both_significant = significant_a is True and significant_b is True
        status = "opposite_significant_trends" if both_significant else "opposite_directions_mixed_significance"
        summary = (
            f"{variable['name']} shows opposite directions in "
            f"{left['region']['name']} y {right['region']['name']}."
        )
    elif direction_a == direction_b and direction_a in {"increasing", "decreasing"}:
        status = "same_direction"
        summary = "The variable shows the same direction of change in both regions."
    else:
        status = "no_divergence"
        summary = "No opposite trend directions were detected between the two regions."

    return {
        "title": "Spatial divergence detected" if status.startswith("opposite_") else "No conclusive spatial divergence",
        "status": status,
        "summary": summary,
        "variable": variable,
        "regions": [
            {
                "id": item["region"]["id"],
                "name": item["region"]["name"],
                "direction": item["trend"].get("direction"),
                "significant": (item.get("interpretation") or {}).get(
                    "significant", item["trend"].get("significant")
                ),
                "change_per_decade": item["trend"].get("change_per_decade"),
                "p_value": item["trend"].get("p_value"),
                "confidence_interval_per_decade": item["trend"].get(
                    "confidence_interval_per_decade"
                ),
            }
            for item in region_results
        ],
        "causality_warning": "Opposite trends do not demonstrate a common cause.",
    }
