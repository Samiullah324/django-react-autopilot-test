# Django + React Autopilot Test

A minimal multi-container app for testing Sunset's per-PR preview deploy feature.

## Architecture

- `frontend/` — React + Vite, served by nginx (primary container, port 80)
- `backend/` — Django + Gunicorn (sidecar container, port 8000)

nginx proxies `/api/*` to `127.0.0.1:8000` so the two containers talk inside
the same ECS task.

## Local dev

```bash
# Backend (terminal 1)
cd backend
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000

# Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

## Sunset Autopilot service config

After adopting this repo, set the services in Autopilot settings to:

| Name     | Dockerfile             | Port | Primary | Health         |
|----------|------------------------|------|---------|----------------|
| frontend | frontend/Dockerfile    | 80   | yes     | /health        |
| backend  | backend/Dockerfile     | 8000 | no      | /api/health/   |

Only the primary container (frontend) is exposed to the ALB; the backend
is reachable inside the task at `127.0.0.1:8000`.
