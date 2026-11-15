# Earth Trend Detective

**From NASA Earth data to understandable evidence.**

Earth Trend Detective is an educational investigation tool for the NASA Space
Apps challenge **“Be An Earth System Trend Detective!”** It helps a user move
from a question to a defensible answer:

1. choose an Earth-system variable;
2. choose a valid NASA POWER rectangle;
3. choose a long observation period;
4. retrieve a monthly time series;
5. measure the rate of change;
6. evaluate statistical evidence; and
7. read the result together with its uncertainty and limitations.

The product is intentionally not a forecasting or causal-inference tool. A
detected trend does not prove what caused it.

## Why this project matters

Earth-data portals expose valuable measurements, but a non-specialist user
often has to make the scientific interpretation alone. This project puts the
interpretation next to the chart:

- a plain-language finding appears before the advanced charts;
- OLS, Mann–Kendall, and Theil–Sen results are shown together;
- confidence intervals, missing-data checks, autocorrelation warnings, and
  method disagreement are visible;
- synthetic demo data is clearly separated from NASA POWER data.

The differentiator is not another chart. It is the bridge from **measurement →
trend → evidence → responsible interpretation**.

## Current scope

- **Active source:** NASA POWER Monthly API.
- **Active variables:** air temperature, precipitation, root-zone soil moisture,
  relative humidity, surface solar radiation, surface pressure, and wind speed.
- **Geography:** one user-selected movable rectangle. The UI does not offer
  predefined regions or point selection.
  Rectangle sizes are limited to valid NASA POWER spans of 2°–10° per axis.
- **Time resolution:** monthly input with annual aggregation for the main trend
  estimate; incomplete calendar years are excluded from that estimate.
- **Secondary comparison:** results include an optional, folded tool for
  comparing two user-defined rectangles with the same variable and period.

NASA POWER products may be model or reanalysis products rather than direct
satellite observations. The interface identifies the source and product
metadata where available.

## What a judge can see in one run

Configure an investigation manually:

1. select a variable from the dropdown;
2. choose the rectangle size and move it to the study area;
3. select a long period, for example 1991–2023;
4. generate the series; and
5. read the finding, trend rate, confidence interval, OLS result,
   Mann–Kendall result, and limitations.

After the primary result, judges can optionally open “Compare two rectangles”
to test the same variable in two independently defined areas.

The project includes real-data checks for Mexican examples. For instance, the
documented Sonora temperature run reports a positive decadal rate with
significant OLS and Mann–Kendall evidence; the Lacandon precipitation example
shows why disagreement between methods must be explained rather than hidden.

## Deploy the frontend to Netlify

The repository includes `netlify.toml`. Set `VITE_API_URL` in Netlify to the
public URL of a separately hosted FastAPI backend. Netlify hosts the React
frontend; it does not run the Python API.

Build settings: base directory `frontend`, command `npm run build`, publish
directory `dist`. The SPA redirect is included so `/dashboard` and `/trends`
work after refresh.

## Run locally

### Requirements

- Python 3.10+
- Node.js 22.12+ or 24+
- Internet access for live NASA POWER data and map tiles

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Swagger is available at
`http://localhost:8000/docs`.

For offline frontend development, the source selector includes an explicitly
labeled reproducible synthetic demo. Demo observations must never be described
as NASA observations.

## Validation

From the repository root:

```bash
pytest -q
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend run test:e2e
```

The current validated branch has **51 backend tests**, **11 frontend tests**, a
passing TypeScript build, and a passing browser flow that exercises real HTTP
analysis responses.

## Scientific limitations

- Statistical significance is evidence under the selected method and
  assumptions, not proof of causality.
- Positive residual autocorrelation is warned about but not automatically
  corrected.
- The main estimate uses complete annual aggregates; it is not a seasonal
  forecasting model.
- Results depend on the selected period, rectangle, POWER product, missing
  values, and assumptions.
- The current MVP uses a user-defined rectangle rather than a global geographic
  search.

## Judge-facing next steps

These are the next improvements in priority order:

1. **Publish a stable public demo and a short screen recording** so judges can
   evaluate the project without local setup.
2. **Run a small usability and accessibility review** with learners or
   educators, especially around the first-screen question and result wording.
3. **Make one finding the showcase path**: reduce the first-run choices and
   highlight a concrete, reproducible result in the demo.
4. **Add a shareable result summary** containing the source, region, period,
   rate, evidence status, and limitations.
5. **Expand geography and data products only after the core workflow is stable**;
   future candidates include global regions and selected NASA Earthdata
   products.

## Documentation

- [Submission brief](docs/submission.md)
- [Challenge alignment and judge review](docs/challenge-review.md)
- [Demo storyboard](docs/demo-storyboard.md)
- [Investigation workflow](docs/investigation-workflow.md)
- [Scientific methodology](docs/statistical-methodology.md)
- [Variable catalog](docs/variable-catalog.md)
- [Region guidelines](docs/region-guidelines.md)
- [NASA POWER documentation](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/)

This is an independent educational project. NASA does not endorse it.
