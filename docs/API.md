# REST API Documentation

Base URL: `/api`

Authentication: JWT Bearer token (`Authorization: Bearer <access_token>`)

## Authentication

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/auth/register/`     | Register new user              |
| POST   | `/auth/login/`        | Login (returns tokens + user)  |
| POST   | `/auth/token/refresh/`| Refresh access token           |
| GET    | `/auth/me/`           | Current user profile           |
| POST   | `/auth/change-password/` | Change password           |
| GET    | `/auth/users/`        | List users (Admin only)        |
| POST   | `/auth/users/`        | Create user (Admin only)       |
| GET    | `/auth/users/{id}/`   | User detail (Admin only)       |

### Login Request

```json
{
  "username": "admin",
  "password": "admin12345"
}
```

### Login Response

```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user": { "id": 1, "username": "admin", "profile": { "role": "admin" } }
}
```

## Inventory

### Dashboard

| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/inventory/dashboard/` | Dashboard statistics     |

### Categories

| Method | Endpoint                        | Description       |
|--------|---------------------------------|-------------------|
| GET    | `/inventory/categories/`        | List categories   |
| POST   | `/inventory/categories/`        | Create category   |
| GET    | `/inventory/categories/{id}/`   | Category detail   |
| PATCH  | `/inventory/categories/{id}/`   | Update category   |
| DELETE | `/inventory/categories/{id}/`   | Delete category   |

### Suppliers

| Method | Endpoint                              | Description        |
|--------|---------------------------------------|--------------------|
| GET    | `/inventory/suppliers/`               | List suppliers     |
| POST   | `/inventory/suppliers/`               | Create supplier    |
| GET    | `/inventory/suppliers/{id}/`          | Supplier detail    |
| GET    | `/inventory/suppliers/{id}/report/`   | Supplier report    |

### Warehouses

| Method | Endpoint                        | Description        |
|--------|---------------------------------|--------------------|
| GET    | `/inventory/warehouses/`        | List warehouses    |
| POST   | `/inventory/warehouses/`        | Create warehouse   |
| GET    | `/inventory/warehouses/{id}/`   | Warehouse detail   |

### Products

| Method | Endpoint                      | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/inventory/products/`        | List products (search, filter)       |
| POST   | `/inventory/products/`        | Create product                       |
| GET    | `/inventory/products/{id}/`   | Product detail                       |
| PATCH  | `/inventory/products/{id}/`   | Update product                       |
| DELETE | `/inventory/products/{id}/`   | Delete product                       |
| POST   | `/inventory/products/import/` | Bulk import (CSV/Excel multipart)    |
| GET    | `/inventory/products/export/` | Export (`?format=csv` or `xlsx`)     |

**Query parameters for product list:**
- `search` — name, SKU, barcode
- `stock_status` — `in_stock`, `low_stock`, `out_of_stock`
- `category`, `supplier`, `is_active`

### Stock Movements

| Method | Endpoint                 | Description                    |
|--------|--------------------------|--------------------------------|
| POST   | `/inventory/stock/move/` | Record stock in/out/adjustment |

**Request body:**

```json
{
  "product": 1,
  "warehouse": 1,
  "quantity": 10,
  "transaction_type": "stock_in",
  "reference": "PO-12345",
  "notes": "Optional notes"
}
```

Transaction types: `purchase`, `sale`, `return`, `adjustment`, `stock_in`, `stock_out`

### Transactions

| Method | Endpoint                           | Description                    |
|--------|--------------------------------------|--------------------------------|
| GET    | `/inventory/transactions/`           | List transaction history       |
| GET    | `/inventory/transactions/report/`    | Download report (`?format=xlsx` or `pdf`) |

### Notifications

| Method | Endpoint                                    | Description              |
|--------|---------------------------------------------|--------------------------|
| GET    | `/inventory/notifications/`                 | List notifications       |
| POST   | `/inventory/notifications/mark-read/`       | Mark all as read         |
| POST   | `/inventory/notifications/{id}/mark-read/`  | Mark one as read         |

## Health Check

| Method | Endpoint       | Description     |
|--------|----------------|-----------------|
| GET    | `/api/health/` | Backend health  |

## Pagination

List endpoints return paginated responses:

```json
{
  "count": 100,
  "next": "http://.../api/inventory/products/?page=2",
  "previous": null,
  "results": []
}
```

## Error Responses

```json
{
  "detail": "Error message"
}
```

Field validation errors return field-keyed objects with HTTP 400.
