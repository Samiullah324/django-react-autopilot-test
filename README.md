# Inventory Management System (InventoryPro)

A full-stack inventory management system with real-time stock tracking, built with Django REST Framework and React.

**Ticket:** DJAN-0001

## Architecture

| Layer     | Stack                                      |
|-----------|--------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS   |
| Backend   | Django 5.2, Django REST Framework, JWT     |
| Database  | PostgreSQL (production) / SQLite (dev)     |
| Deploy    | Docker multi-container (nginx + Gunicorn)  |

## Features

- **Dashboard** — Overview cards, charts, recent activity timeline
- **Product Management** — CRUD, search/filter, CSV/Excel import/export
- **Inventory Tracking** — Stock in/out, warehouse-based quantities, adjustment logs
- **Supplier Management** — Contacts, purchase history, supplier reports
- **Transactions** — Full history with PDF/Excel report downloads
- **User Roles** — Admin, Manager, Staff with role-based access control
- **Notifications** — Low stock and out-of-stock alerts
- **UI/UX** — Responsive design, dark/light mode, modern SaaS-style interface

## Quick Start (Local Dev)

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Demo Accounts

| Username | Password     | Role    |
|----------|--------------|---------|
| admin    | admin12345   | Admin   |
| manager  | manager123   | Manager |
| staff    | staff123     | Staff   |

## PostgreSQL (Optional)

Set environment variables before starting the backend:

```bash
export POSTGRES_DB=inventory
export POSTGRES_USER=inventory
export POSTGRES_PASSWORD=inventory
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

## Running Tests

```bash
cd backend
python manage.py test
```

## API Documentation

See [docs/API.md](docs/API.md) for the full REST API reference.

## Docker Deployment

```bash
# Build and run backend
cd backend && docker build -t inventory-backend .

# Build and run frontend
cd frontend && docker build -t inventory-frontend .
```

### Sunset Autopilot Service Config

| Name     | Dockerfile          | Port | Primary | Health       |
|----------|---------------------|------|---------|--------------|
| frontend | frontend/Dockerfile | 80   | yes     | /health      |
| backend  | backend/Dockerfile  | 8000 | no      | /api/health/ |

## Project Structure

```
backend/
  accounts/          # User profiles, JWT auth, RBAC
  inventory/         # Products, stock, suppliers, transactions
  server/            # Django settings and URLs
frontend/
  src/
    components/      # Layout, shared UI
    context/         # Auth and theme providers
    pages/           # Dashboard, Products, Inventory, etc.
    lib/             # API client, download helpers
docs/
  API.md             # REST API documentation
```

## Role Permissions

| Action              | Admin | Manager | Staff |
|---------------------|-------|---------|-------|
| View dashboard/data | ✓     | ✓       | ✓     |
| Create/edit products| ✓     | ✓       | ✗     |
| Stock movements     | ✓     | ✓       | ✗     |
| Manage suppliers    | ✓     | ✓       | ✗     |
| User management     | ✓     | ✗       | ✗     |
