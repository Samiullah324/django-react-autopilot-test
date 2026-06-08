# Django + React Autopilot Test

A multi-container **Django + React** application used to validate [Sunset Autopilot](https://github.com/Samiullah324/django-react-autopilot-test) preview deployments. It ships a full-stack inventory management system: a React SPA for day-to-day operations and a Django REST API for products, stock, suppliers, warehouses, transactions, and notifications.

Repository: [Samiullah324/django-react-autopilot-test](https://github.com/Samiullah324/django-react-autopilot-test)

## Tech Stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | React 18, TypeScript, Vite, React Router, Recharts |
| Backend  | Django 5.2, Django REST Framework, Simple JWT |
| Database | PostgreSQL (production) or SQLite (local dev) |
| Deploy   | Docker, nginx, Gunicorn |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  ECS task (single task, two containers)             │
│                                                     │
│  ┌──────────────────┐    proxy /api/*, /media/*    │
│  │ frontend (nginx) │ ──────────────────────────►  │
│  │ port 3000        │         127.0.0.1:8000       │
│  └──────────────────┘                              │
│           ▲                    ┌──────────────────┐ │
│           │                    │ backend (Django) │ │
│     ALB / health               │ port 8000        │ │
│                                └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- `frontend/` — React + Vite SPA served by nginx (primary container), with responsive UI and dark/light mode
- `backend/` — Django + DRF REST API with JWT authentication (sidecar)
- **Database:** PostgreSQL in production; SQLite for local dev (`USE_SQLITE=1`, default)

Only the primary frontend container is exposed to the load balancer. nginx proxies `/api/*` and `/media/*` to the Django sidecar at `127.0.0.1:8000`.

## Project Structure

```
├── backend/
│   ├── accounts/          # Custom user model, JWT auth, roles
│   ├── inventory/         # Products, stock, transactions, reports
│   ├── server/            # Django settings and URL routing
│   ├── Dockerfile
│   ├── entrypoint.sh      # migrate, seed, gunicorn
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/           # API client
    │   ├── components/    # Shared UI components
    │   ├── context/       # Auth and theme providers
    │   └── pages/         # Inventory management views
    ├── Dockerfile
    └── nginx.conf
```

## Features

- **Dashboard** — Overview stats, category charts, transaction trends, activity timeline
- **Products** — CRUD, search/filters, CSV/Excel import/export, stock status
- **Inventory** — Stock in/out, real-time quantity updates, low-stock alerts
- **Suppliers** — Contact management and supplier-wise reports
- **Warehouses** — Location-based stock tracking
- **Transactions** — Full history (purchases, sales, returns, adjustments) with PDF/Excel export
- **Notifications** — Low stock, out of stock, and expiry alerts
- **Roles** — Admin, Manager, Staff with role-based access control
- **API Docs** — Interactive OpenAPI schema at `/api/docs/`

## Prerequisites

- Python 3.12+
- Node.js 20+
- npm

SQLite is used by default for local development; PostgreSQL is optional.

## Local Development

```bash
# Backend (terminal 1)
cd backend
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py seed_demo_data
python3 manage.py runserver 0.0.0.0:8000

# Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and sign in with **admin / admin12345**. The Vite dev server proxies `/api` requests to Django on port 8000.

Explore the inventory API interactively at http://localhost:8000/api/docs/.

### PostgreSQL

```bash
export USE_SQLITE=0
export POSTGRES_DB=inventory
export POSTGRES_USER=inventory
export POSTGRES_PASSWORD=inventory
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_SQLITE` | `1` | Use SQLite when `1`; PostgreSQL when `0` |
| `POSTGRES_*` | see above | PostgreSQL connection settings |
| `DJANGO_SECRET_KEY` | dev key | Django secret key |
| `DJANGO_DEBUG` | `1` | Enable debug mode |
| `DJANGO_ALLOWED_HOSTS` | `*` | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | — | Comma-separated CORS origins (non-debug) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | JWT login |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user |
| CRUD | `/api/auth/users/` | User management (admin) |
| GET | `/api/dashboard/` | Dashboard analytics |
| CRUD | `/api/categories/` | Product categories |
| CRUD | `/api/products/` | Product management |
| POST | `/api/products/import_file/` | Bulk CSV/Excel import |
| GET | `/api/products/export/` | CSV/Excel export |
| CRUD | `/api/suppliers/` | Supplier management |
| CRUD | `/api/warehouses/` | Warehouse management |
| GET | `/api/stock/` | Warehouse stock levels |
| POST | `/api/stock/move/` | Stock in/out/adjustments |
| GET | `/api/transactions/` | Transaction history |
| GET | `/api/transactions/export/` | PDF/Excel reports |
| GET | `/api/notifications/` | Alerts |
| GET | `/api/health/` | Backend health check |

Full interactive documentation: `/api/docs/`

## Testing

```bash
cd backend
python3 manage.py test inventory.tests
```

## Deployment (Sunset Autopilot)

| Name     | Dockerfile          | Port | Primary | Health         |
|----------|---------------------|------|---------|----------------|
| frontend | frontend/Dockerfile | 3000 | yes     | `/health`      |
| backend  | backend/Dockerfile  | 8000 | no      | `/api/health/` |

The backend container runs migrations and seeds demo data on startup.

## Default Users (demo seed)

| Username | Password    | Role    |
|----------|-------------|---------|
| admin    | admin12345  | Admin   |
| manager  | manager123  | Manager |
| staff    | staff123    | Staff   |

Change passwords before production use.
