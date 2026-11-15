# Challenge alignment and judge review

This document is a judge-facing review of the current MVP. It describes what
is implemented, what evidence supports it, and what is still required for a
strong final submission. It is not a guarantee of an award or a substitute
for independent scientific review.

## Questions a judge is likely to ask

### 1. What problem does this solve?

It reduces the gap between accessing Earth data and interpreting it. The user
gets a finding, rate of change, evidence status, and limitations instead of
having to infer all four from a raw chart.

### 2. Is the NASA data real?

Yes, when the source is set to NASA POWER. The application calls the NASA POWER
Monthly API and labels the source and product metadata. The synthetic provider
is separate and explicitly labeled as a demo.

### 3. Does it satisfy the challenge workflow?

Yes. The core flow is variable → rectangle → period → data → time series → rate →
statistical evidence → limitations.

### 4. What is scientifically different from a simple regression chart?

The result combines OLS/t-test, Mann–Kendall, and Theil–Sen evidence; reports
confidence intervals; checks missing and incomplete years; warns about
autocorrelation; and explains disagreement between methods. It also avoids
claiming causality.

### 5. Can a judge reproduce the result?

Yes locally, using the documented commands and the built-in 1991–2023 examples.
The project includes backend, frontend, build, and browser tests. A stable
public demo remains a submission priority.

### 6. What can the tool not claim?

It cannot identify causes, forecast the future, correct every statistical
assumption, or replace a complete scientific analysis. The current regional MVP
focuses on Mexico and uses NASA POWER products that may be model/reanalysis
products rather than direct satellite observations.

## Requirement matrix

| Requirement | Status | Evidence | Honest limitation |
| --- | --- | --- | --- |
| Choose an Earth-system variable | Complete | Seven-variable NASA POWER catalog and dropdown | Additional NASA products are future work |
| Choose a region | Complete | User-defined movable rectangle | Current MVP is not global |
| Use a sufficiently long period | Complete | 1991–2023 examples; date validation | Short periods can be low power |
| Retrieve or load data | Complete | NASA POWER provider and labeled synthetic provider | Live NASA access needs Internet |
| Visualize a time series | Complete | One panel per variable with trend and confidence band | Monthly display uses an annual trend estimate |
| Measure rate of change | Complete | OLS and Theil–Sen rates, including per-decade rate | Rate depends on period and product |
| Evaluate significance | Complete | OLS/t-test, Mann–Kendall, p-values, confidence intervals | Autocorrelation is warned about, not corrected |
| Explain result and limitations | Complete | Findings-first result, glossary, warnings, provenance | Learner testing is still pending |
| Explore regional contrast | Secondary | Folded two-rectangle comparison after the main result | Exploratory only; it does not test causal differences between slopes |

## Judge-oriented strengths

- Direct alignment with the challenge rather than a generic dashboard.
- Real NASA POWER integration with transparent provenance.
- Scientific checks are visible to non-specialists.
- Results do not overclaim causality.
- The application has a guided path and reproducible examples.
- The codebase has automated backend, frontend, build, and browser validation.

## Remaining risks

1. **Demo readiness:** a public URL and a short recorded walkthrough are not yet
   part of the repository.
2. **First-run complexity:** the application exposes many scientific options;
   the showcase path should foreground one concrete finding.
3. **Accessibility evidence:** automated browser coverage exists, but a complete
   accessibility audit and learner usability study are still pending.
4. **Documentation drift:** judge-facing documentation must remain consistent
   with the current rectangle-only Mexico MVP.

## Prioritized next steps

### P0 — before submission

- Publish and smoke-test a stable demo URL.
- Record the 30-second story using one reproducible result.
- Verify the submission text, UI labels, screenshots, and repository all use the
  same scope and terminology.

### P1 — highest value improvement

- Run a short learner/educator usability test.
- Complete an accessibility pass for keyboard navigation, focus states,
  contrast, map instructions, and chart alternatives.
- Add a shareable result card or export containing source, region, period, rate,
  evidence status, and limitations.

### P2 — after the core experience

- Reduce optional choices on the first run and make the showcase finding more
  prominent.
- Expand beyond the current Mexican regions.
- Add carefully selected NASA Earthdata products only after documenting their
  units, coverage, and statistical treatment.

## Validation record

- `pytest -q`: 51 passed.
- `npm --prefix frontend test`: 11 passed.
- Frontend typecheck and production build: passed.
- `npm --prefix frontend run test:e2e`: passed with real HTTP analysis responses.
- Numerical cross-checks against SciPy and pymannkendall: documented in
  `docs/statistical-methodology.md`.

These checks validate the current implementation; they do not constitute a
complete accessibility audit, field study, or independent scientific review.
