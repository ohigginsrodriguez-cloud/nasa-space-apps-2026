# NASA Space Apps Challenge Submission

## Project name

**Earth System Trend Detective**

## Tagline

**From NASA Earth data to understandable evidence.**

## High-level project summary

Earth System Trend Detective is an educational web application that helps
students, educators, and citizen scientists investigate how Earth system
variables change over time. Users select a NASA POWER variable, define a
region and time period, generate a monthly time series, and evaluate the rate
and statistical evidence of the observed trend.

The application combines OLS regression, Mann–Kendall, Theil–Sen slope
estimation, confidence intervals, missing-data checks, and plain-language
interpretation. It makes uncertainty, method disagreement, data provenance,
and the limits of causal interpretation visible instead of hiding them.

## Challenge alignment

The project addresses **Be An Earth System Trend Detective!** by supporting the
complete investigation workflow:

1. Identify an Earth science variable.
2. Select a region.
3. Choose a sufficiently long time period.
4. Retrieve a reproducible time series.
5. Visualize change over time.
6. Estimate the rate of change.
7. Evaluate statistical evidence.
8. Explain limitations without claiming causality.

## NASA data

The active data source is the **NASA POWER Monthly API**:

- API: https://power.larc.nasa.gov/api/temporal/monthly
- Documentation: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
- Variables currently supported: air temperature, precipitation, root-zone
  soil moisture, relative humidity, surface solar radiation, surface pressure,
  and wind speed.
- The catalog records the relevant POWER parameter and product/model metadata
  for each variable.

NASA POWER values may represent model or reanalysis products rather than direct
satellite observations. The interface identifies the source and product where
metadata are available. Synthetic demo data are explicitly labeled and are
never presented as NASA observations.

## Space agency partner data and other references

MODIS, GLDAS, SWOT, GPM, Giovanni, and AppEEARS are documented as possible
future integrations or reference resources. They are not represented as active
data integrations in the current analysis pipeline.

Other software and reference dependencies include:

- SciPy for statistical calculations.
- pymannkendall for independent Mann–Kendall validation.
- React, Recharts, Leaflet, and OpenStreetMap tiles for the interface.

## Use of Super Intelligence (SI)

The team used generative AI as a development and review assistant. SI helped
with code exploration, refactoring suggestions, test-case design, interface
copy editing, and submission planning. Team members reviewed, tested, and
approved the resulting code and scientific wording. SI was not treated as a
source of Earth science measurements, statistical results, or scientific
validation.

## Limitations and responsible interpretation

This is an educational trend-exploration tool, not a replacement for a full
scientific analysis. A statistically significant trend does not establish its
cause. A non-significant result does not prove that no change exists. Results
depend on the selected period, spatial representation, data product, missing
values, and statistical assumptions, including possible temporal
autocorrelation.

## NASA disclaimer

NASA does not endorse any non-U.S. Government entity and is not responsible for
information contained on non-U.S. Government websites. This is an independent
educational project submitted to the NASA Space Apps Challenge. Users must
comply with the data-use terms of each source.

## 30-second demo script

**0–3 s — The challenge**

“Earth science data contains signs of change, but finding and interpreting
those trends can be difficult.”

**3–7 s — The project**

“Earth System Trend Detective turns NASA Earth data into an understandable
investigation.”

**7–14 s — The workflow**

Show the user selecting a variable, a region, and a long time period.

**14–22 s — The evidence**

Show the monthly series, rate of change, confidence interval, OLS result, and
Mann–Kendall result.

**22–27 s — The differentiator**

“It shows uncertainty, warns when methods disagree, and explains what the data
cannot prove.”

**27–30 s — The impact**

“Students and communities can explore how Earth systems change using real NASA
POWER data.”
