# Inventory Management System

A full-stack inventory management application built with Django REST Framework and React, implementing **DJAN-0001**.

## Architecture

- `frontend/` — React + Vite SPA with modern responsive UI, dark/light mode
- `backend/` — Django + DRF REST API with JWT authentication
- **Database:** PostgreSQL (production) or SQLite (local dev via `USE_SQLITE=1`)

nginx proxies `/api/*` and `/media/*` to the Django sidecar on port 8000.

## Features

- **Dashboard** — Overview stats, category charts, transaction trends, activity timeline
- **Products** — CRUD, search/filters, CSV/Excel import/export, stock status
- **Inventory** — Stock in/out, real-time quantity updates, low-stock alerts
- **Suppliers** — Contact management and supplier-wise reports
- **Warehouses** — Location-based stock tracking
- **Transactions** — Full history (purchases, sales, returns, adjustments) with PDF/Excel export
- **Notifications** — Low stock, out of stock, and expiry alerts
- **Roles** — Admin, Manager, Staff with role-based access control
- **API Docs** — OpenAPI schema at `/api/docs/`

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

Open http://localhost:3000 and sign in with **admin / admin12345**.

### PostgreSQL

```bash
export USE_SQLITE=0
export POSTGRES_DB=inventory
export POSTGRES_USER=inventory
export POSTGRES_PASSWORD=inventory
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | JWT login |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user |
| GET | `/api/dashboard/` | Dashboard analytics |
| CRUD | `/api/products/` | Product management |
| POST | `/api/products/import_file/` | Bulk CSV/Excel import |
| GET | `/api/products/export/` | CSV/Excel export |
| CRUD | `/api/suppliers/` | Supplier management |
| CRUD | `/api/warehouses/` | Warehouse management |
| POST | `/api/stock/move/` | Stock in/out/adjustments |
| GET | `/api/transactions/` | Transaction history |
| GET | `/api/transactions/export/` | PDF/Excel reports |
| GET | `/api/notifications/` | Alerts |

Full interactive documentation: `/api/docs/`

## Testing

```bash
cd backend
python3 manage.py test inventory.tests
```

## Deployment (Sunset Autopilot)

| Name     | Dockerfile             | Port | Primary | Health         |
|----------|------------------------|------|---------|----------------|
| frontend | frontend/Dockerfile    | 80   | yes     | /health        |
| backend  | backend/Dockerfile     | 8000 | no      | /api/health/   |

The backend container runs migrations and seeds demo data on startup.

## Default Users (demo seed)

| Username | Password    | Role    |
|----------|-------------|---------|
| admin    | admin12345  | Admin   |
| manager  | manager123  | Manager |
| staff    | staff123    | Staff   |

Change passwords before production use.
