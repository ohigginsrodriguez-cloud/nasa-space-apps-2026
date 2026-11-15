# Public deployment checklist

The application is ready to be deployed as two public services. A public URL
is still required before submission; this repository does not contain hosting
credentials.

## Recommended architecture

- **Frontend:** Vercel, Netlify, or another static-hosting provider.
- **Backend:** Render, Railway, Fly.io, or another Python ASGI host.
- **Frontend environment variable:** `VITE_API_URL=https://<public-backend>/`
- **Backend environment variable:** `FRONTEND_ORIGINS=https://<public-frontend>`

## Backend

Build and start commands:

```bash
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend
```

Health check:

```text
GET /health
```

The backend needs outbound HTTPS access to NASA POWER. No NASA credential is
required. Enable persistent storage for `data/cache` if the hosting provider
supports it; the cache is an optimization, not a source of truth.

### Render quick setup

The repository includes `render.yaml`. In Render, create a Blueprint from the
repository and set `FRONTEND_ORIGINS` to the final Netlify URL. The blueprint
uses the `/health` endpoint and starts the API with the required `backend`
application directory.

## Frontend

Build and publish:

```bash
npm ci
npm run build
```

Publish the `frontend/dist` directory. Configure the host to serve
`index.html` for the `/dashboard` and `/trends` client-side routes.

## Before sharing the link

- Open the frontend URL in a private browser window.
- Confirm the page loads without login or special permissions.
- Run one real NASA POWER analysis.
- Run one synthetic demo analysis and verify it is visibly labeled.
- Open the guide, glossary, provenance panel, and comparison view.
- Check the page at 390 px width.
- Confirm the browser console has no errors.
- Confirm the backend health endpoint is public and returns HTTP 200.
- Record both URLs in the NASA submission form.

Netlify alone hosts only the React frontend. The FastAPI service must be
deployed separately and its public URL must be assigned to `VITE_API_URL`.

## Submission evidence

The final submission should link to:

1. The public application.
2. The public 30-second demo or seven-slide deck.
3. The source repository.
4. `docs/submission.md` content copied into the English submission fields.

Do not claim that deployment or integrations are complete until the public
links have been tested from a private browser.
