# Task #21 — Authentication & Authorization

## Scope

Implement complete user management, authentication, and authorization so Sign Up and Sign In are fully operational for the React frontend against the Django REST API. Admin users remain Django Admin–only (no admin UI in the app).

## Key decisions

- **JWT auth** via `djangorestframework-simplejwt` with refresh token rotation and blacklist (`token_blacklist` app) for logout.
- **Access token blacklist**: `AccessToken` does not ship with `blacklist()` in simplejwt; access tokens are blacklisted manually via `OutstandingToken`/`BlacklistedToken`, and `JWTAuthenticationWithAccessBlacklist` rejects blacklisted access JTIs.
- **Access token lifetime**: 1 hour; **refresh**: 7 days.
- **Registration** creates standard `staff` role users with `is_staff=False` and `is_superuser=False`; role validity is checked against `User.Role.choices`.
- **Email normalization**: stored lowercase via `normalize_email()` in serializers (case-insensitive uniqueness in app layer).
- **Login** accepts username or email; failures always return a generic message (`Unable to log in with provided credentials.`) to avoid account enumeration.
- **Password policy**: Django validators + custom `ComplexityValidator` (uppercase, lowercase, number, min 8 chars).
- **Password change / logout**: blacklists all user refresh tokens plus the current access token; forces re-authentication.
- **Logout**: validates refresh/access tokens belong to the authenticated user before blacklisting.
- **Rate limiting**: DRF `AuthRateThrottle` (10/min) on register, login, and refresh endpoints.
- **CSRF**: JWT sent via `Authorization` header (not cookies), so CSRF does not apply to API auth; session CSRF remains handled by Django for admin.
- **Frontend tokens**: `localStorage` (remember me) or `sessionStorage`; single-storage lookup (no cross-storage fallback); refresh mutex prevents parallel 401 refresh races.
- **XSS mitigation**: browser storage documented as XSS-sensitive in `client.ts`; CSP headers added via Django middleware (API) and nginx (SPA).
- **No admin UI**: Existing admin-only `/api/auth/users/` endpoints unchanged; not exposed in React.

## Files changed

### Backend
| File | Why |
|------|-----|
| `backend/accounts/authentication.py` | Custom JWT auth checking access-token blacklist |
| `backend/accounts/utils.py` | Email normalization, token blacklisting helpers |
| `backend/accounts/throttling.py` | Auth endpoint rate limiting |
| `backend/accounts/validators.py` | Password complexity validator |
| `backend/accounts/serializers.py` | Registration, login, profile, change-password serializers |
| `backend/accounts/views.py` | Auth views with secure logout and password invalidation |
| `backend/accounts/urls.py` | Auth URL routes |
| `backend/accounts/migrations/0002_token_blacklist_dependency.py` | Ensures token_blacklist migrations apply in deploy order |
| `backend/accounts/tests/test_auth.py` | Auth API test coverage (incl. security cases) |
| `backend/server/middleware.py` | Content-Security-Policy headers |
| `backend/server/settings.py` | JWT, blacklist, throttle, CSP middleware, auth class |
| `backend/inventory/management/commands/seed_demo_data.py` | DEV ONLY warning for demo credentials |

### Frontend
| File | Why |
|------|-----|
| `frontend/src/api/client.ts` | Auth API, token storage, refresh mutex, XSS documentation |
| `frontend/src/constants/validation.ts` | Shared password hint/validation |
| `frontend/src/context/AuthContext.tsx` | Auth state; clears tokens on password change |
| `frontend/src/pages/LoginPage.tsx` | Sign-in UX |
| `frontend/src/pages/SignUpPage.tsx` | Registration form |
| `frontend/src/pages/ProfilePage.tsx` | Profile edit and password change |
| `frontend/src/App.tsx` | Routes |
| `frontend/src/components/Layout.tsx` | Profile nav, logout redirect |
| `frontend/src/styles/global.css` | Auth form styles |
| `frontend/nginx.conf` | CSP headers for SPA |

## Demo / development credentials

`python manage.py seed_demo_data` creates **development-only** demo users:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin12345` | Admin (Django superuser) |
| `manager` | `manager123` | Manager |
| `staff` | `staff123` | Staff |

The seed command prints a `DEV ONLY` warning. These accounts are for local/demo use only — not for production. New application users register via `/signup`.

## Verification

```bash
cd backend && USE_SQLITE=1 python3 manage.py migrate && USE_SQLITE=1 python3 manage.py test accounts inventory
cd frontend && npm run typecheck && npm run build
```

## Open questions / follow-ups

- **httpOnly cookies**: preferable for production token storage but require cookie-based auth, CSRF tokens, and CORS credential changes; deferred in favor of documented XSS risk + CSP.
- **Infrastructure rate limiting**: DRF throttling covers app-level limits; additional WAF/API-gateway rate limits recommended for production.
- **HTTPS**: required in production (terminate TLS at load balancer / reverse proxy).

## Review follow-up (PR feedback)

Addressed reviewer security/correctness items: access-token blacklist on logout/password change, logout token ownership validation, generic login errors, refresh mutex, specific logout exceptions, token_blacklist migration dependency, email normalization, password-change token invalidation, auth rate limiting, CSP headers, shared validation constants, expanded tests.
