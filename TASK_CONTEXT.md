# Task #19 — Product CRUD

## Scope

Implement complete CRUD functionality for product management so the Products section is fully operational: create, read, update, delete, with backend validation, API integration, frontend form validation, and error/loading states.

## Assumptions

- The repository already had a `Product` model, DRF `ProductViewSet`, serializers, URL routing, and a basic `ProductsPage`. This task focused on making CRUD **fully operational** by strengthening validation, test coverage, and UI feedback rather than rebuilding from scratch.
- Stock quantity is managed via warehouse stock movements (`InventoryPage`), not directly on the product form — consistent with existing domain design.

## Implementation decisions

1. **Backend validation** — Extended `ProductWriteSerializer` with explicit checks for required name/SKU, duplicate SKU (case-insensitive), non-negative price, and non-negative low-stock threshold.
2. **Frontend UX** — Matched patterns from `LoginPage` and `InventoryPage`: client-side validation before submit, API field-error mapping, loading/saving/deleting states, empty list state, and import error handling.
3. **Tests** — Expanded `inventory.tests.test_api` with list, retrieve, update, delete, permission, and validation failure cases (duplicate SKU, negative price).

## Files changed

| File | Why |
|------|-----|
| `backend/inventory/serializers.py` | Product write validation for create/update |
| `backend/inventory/tests/test_api.py` | Full product CRUD and validation test coverage |
| `frontend/src/pages/ProductsPage.tsx` | Form validation, error handling, loading states |
| `frontend/src/styles/global.css` | `.field-error` style for inline validation messages |

## Verification

```bash
cd backend && USE_SQLITE=1 python3 manage.py test inventory.tests
cd frontend && npm run build
```

## Open questions / follow-ups

- None for this ticket. Optional future work: product detail view modal with per-warehouse stock breakdown (API already supports `GET /api/products/:id/`).
