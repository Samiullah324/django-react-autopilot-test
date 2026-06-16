# Task #20: Inventory CRUD

## Scope

Implement complete CRUD functionality for Inventory management so the Inventory section is fully operational (create, view, update, delete products; validations; API integration; UI).

## Key decisions

- **Reuse existing `Product` model** — inventory items are products; no new DB model was added.
- **`/api/inventory/` endpoints** — new `InventoryViewSet` mirrors product CRUD at the task-specified URL while keeping existing `/api/products/` unchanged for backward compatibility.
- **Quantity** — stored per warehouse via `WarehouseStock`; the Inventory page shows `total_quantity` (read-only) and continues to support stock in/out via `/api/stock/move/`.
- **Permissions** — same as products: staff can list/retrieve; managers/admins can create/update/delete.
- **Validations** — `ProductWriteSerializer`: required name/sku, `price > 0`, `low_stock_threshold >= 0`. `StockMovementSerializer`: `quantity >= 1`.

## Files changed

| File | Why |
|------|-----|
| `backend/inventory/views.py` | Added `InventoryViewSet` for `/api/inventory/` CRUD |
| `backend/inventory/urls.py` | Registered `inventory` router |
| `backend/inventory/serializers.py` | Field validations on write and stock movement |
| `backend/inventory/tests/test_api.py` | Tests for inventory list/retrieve/create/update/delete and validation |
| `frontend/src/api/client.ts` | `inventory`, `inventoryItem`, `createInventoryItem`, `updateInventoryItem`, `deleteInventoryItem` |
| `frontend/src/pages/InventoryPage.tsx` | Full CRUD UI, loading/error/success states, manager-gated actions |

## Open questions / follow-ups

- None for this ticket. Optional future work: pagination on the Inventory table (backend already paginates).
