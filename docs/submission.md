# Judge-facing submission brief

## Project

**Earth Trend Detective**

**Tagline:** From NASA Earth data to understandable evidence.

## The problem

Earth-data portals contain important signals, but many learners and community
users cannot easily move from a variable and a map to a statistically
responsible conclusion. They need to know not only **what changed**, but also
**how fast**, **how strong the evidence is**, and **what the data cannot prove**.

## The solution

Earth Trend Detective turns a question into a guided investigation. A user
selects a NASA POWER variable, a Mexican region, a valid regional rectangle,
and a long period. The application retrieves a monthly series and presents a
plain-language finding before exposing the chart and advanced statistical
details.

The project’s distinctive value is the interpretation layer: OLS,
Mann–Kendall, and Theil–Sen estimates are compared; confidence intervals and
data-quality warnings are shown; and method disagreement is explained instead
of being hidden.

## Challenge alignment

| Challenge requirement | Evidence in the project |
| --- | --- |
| Identify an Earth-system variable | NASA POWER catalog with seven active variables |
| Select a region | Four Mexican regions and a valid movable rectangle |
| Choose a long period | Built-in 1991–2023 examples and validated date limits |
| Retrieve data | NASA POWER Monthly API or explicitly labeled synthetic demo |
| Visualize change | Monthly series, trend line, confidence band, panel per variable |
| Measure rate | OLS and Theil–Sen rates, including decadal interpretation |
| Evaluate evidence | OLS/t-test, Mann–Kendall, p-values, confidence intervals |
| Explain responsibly | Plain-language findings, warnings, glossary, and limitations |

## NASA data and reproducibility

The active real-data provider is the [NASA POWER Monthly
API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/). The
application records the variable, source, product metadata where available,
region, period, and data-quality state.

The current MVP uses:

- air temperature;
- precipitation;
- root-zone soil moisture;
- relative humidity;
- surface solar radiation;
- surface pressure; and
- wind speed.

POWER regional rectangles must span 2°–10° on both axes. The UI creates a valid
rectangle automatically and offers only valid sizes. Synthetic data exists for
reproducible development and is always labeled as synthetic.

## Scientific responsibility

The main trend estimate uses complete annual aggregates of monthly data.
Precipitation is accumulated correctly by calendar month; state variables use
day-weighted means. OLS, Mann–Kendall, and Theil–Sen provide complementary
evidence rather than a single authoritative answer.

The interface warns about short series, missing years, autocorrelation,
constant series, and disagreement between methods. A significant trend does
not establish its cause, and a non-significant result does not prove that no
change exists.

## Suggested 30-second demonstration

1. **Problem — 0–4 s:** Earth data contains signals, but interpretation is
   difficult.
2. **Question — 4–9 s:** Open a long-period question about temperature in the
   Sonoran Desert.
3. **Evidence — 9–20 s:** Show the result: rate per decade, confidence interval,
   OLS and Mann–Kendall evidence.
4. **Responsibility — 20–26 s:** Show the warning/glossary and explain that a
   trend is not a cause.
5. **Impact — 26–30 s:** Students and communities can investigate Earth-system
   change with the same transparent workflow.

## Current validation

- 51 backend tests passing.
- 11 frontend tests passing.
- TypeScript typecheck and production build passing.
- End-to-end browser flow passing with real HTTP analysis responses.
- Numerical verification against SciPy and pymannkendall documented in
  `docs/statistical-methodology.md`.

## Honest limitations

- The current regional MVP focuses on Mexico rather than global geography.
- NASA POWER products can be model/reanalysis products, not direct satellite
  observations.
- Autocorrelation is reported but not automatically corrected.
- The tool is educational and does not replace a full scientific study.
- A stable public demo URL and learner usability study are still pending.

## Next steps before final submission

1. Publish a stable demo URL and record the 30-second walkthrough.
2. Test the first-run flow with learners or educators and perform an
   accessibility pass.
3. Add a shareable result summary for judges and classroom use.
4. Use one carefully documented finding as the showcase story.
5. Expand geography and additional NASA Earthdata products after validating the
   core experience.

## Independent-project notice

This is an independent educational project submitted to NASA Space Apps.
NASA does not endorse any non-U.S. Government entity and is not responsible for
information on non-U.S. Government websites.
