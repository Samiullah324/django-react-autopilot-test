# Task #19 — Product CRUD

## Scope

Implement complete CRUD functionality for product management so the Products section is fully operational: create, view, update, delete products with validations, API integration, and UI feedback.

## Key decisions

- **Reuse existing `Product` model** in `backend/inventory/models.py` rather than adding a standalone `quantity` field. Stock quantity is derived from `WarehouseStock` (`total_quantity`); the UI shows aggregated quantity and low-stock threshold per existing inventory design.
- **Validation layers**: model `clean()` plus `ProductWriteSerializer` field/object validation for API inputs (name/SKU required, price > 0, threshold >= 0).
- **Frontend patterns**: matched `InventoryPage` / `LoginPage` for success/error banners, loading/saving states, and `ApiError` handling. Added `getFieldErrors()` helper to surface DRF field errors inline.
- **Permissions**: unchanged — staff can list/view; managers/admins can create/update/delete (existing `ProductViewSet` behavior).

## Files changed

| File | Why |
|------|-----|
| `backend/inventory/models.py` | Model-level validation on `Product` (`name`, `sku`, `price`) |
| `backend/inventory/serializers.py` | Serializer validation; include `description` in list responses |
| `backend/inventory/tests/test_api.py` | Product CRUD and validation API tests |
| `frontend/src/api/client.ts` | `getFieldErrors()` for DRF validation payloads |
| `frontend/src/pages/ProductsPage.tsx` | Full CRUD UX: validation, errors, loading, empty state, description column |
| `frontend/src/styles/global.css` | `.field-error`, `.empty-state`, `.text-muted` styles |

## Assumptions

- Product quantity in the UI refers to `total_quantity` from warehouse stock, not a direct product column.
- No new Django migration required (model fields unchanged; only validation added).
- No frontend unit tests added (repo has no established React test pattern).

## Verification

```bash
cd backend && USE_SQLITE=1 python3 manage.py test inventory.tests.test_api
cd frontend && npm run typecheck && npm run build
```

## Open questions / follow-ups

- None for this ticket.
