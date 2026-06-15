# Task #21 — Authentication & Authorization

## Scope

Implement complete user management, authentication, and authorization so Sign Up and Sign In are fully operational for the React frontend against the Django REST API. Admin users remain Django Admin–only (no admin UI in the app).

## Key decisions

- **JWT auth** via `djangorestframework-simplejwt` with refresh token rotation and blacklist (`token_blacklist` app) for logout.
- **Access token lifetime**: 1 hour; **refresh**: 7 days.
- **Registration** creates standard `staff` role users with `is_staff=False` and `is_superuser=False`.
- **Login** accepts username or email in the `username` field.
- **Password policy**: Django validators + custom `ComplexityValidator` (uppercase, lowercase, number, min 8 chars).
- **Endpoints**: Added `/api/auth/register/`, `/logout/`, `/user/`, `/change-password/`; kept `/api/auth/me/` as a backward-compatible alias for `/user/`.
- **Frontend tokens**: `localStorage` when “Remember me” is checked, otherwise `sessionStorage`; 401 responses trigger refresh retry.
- **No admin UI**: Existing admin-only `/api/auth/users/` endpoints unchanged; not exposed in React.

## Files changed

### Backend
| File | Why |
|------|-----|
| `backend/accounts/validators.py` | Password complexity validator |
| `backend/accounts/serializers.py` | Registration, login, profile update, change-password serializers |
| `backend/accounts/views.py` | Register, logout, user profile, change-password views |
| `backend/accounts/urls.py` | New auth URL routes |
| `backend/accounts/tests/test_auth.py` | Auth API test coverage |
| `backend/server/settings.py` | Token blacklist, JWT lifetimes, password validators |

### Frontend
| File | Why |
|------|-----|
| `frontend/src/api/client.ts` | Auth API methods, token storage, error parsing |
| `frontend/src/context/AuthContext.tsx` | Register, logout API, profile/password updates |
| `frontend/src/pages/LoginPage.tsx` | Sign-in UX, remember me, sign-up link |
| `frontend/src/pages/SignUpPage.tsx` | Registration form with validation |
| `frontend/src/pages/ProfilePage.tsx` | Profile edit and change password |
| `frontend/src/App.tsx` | `/signup` and `/profile` routes |
| `frontend/src/components/Layout.tsx` | Profile nav, logout redirect |
| `frontend/src/styles/global.css` | Auth form styles |

## Verification

```bash
cd backend && USE_SQLITE=1 python3 manage.py test accounts inventory
cd frontend && npm run typecheck && npm run build
```

## Open questions / follow-ups

- Rate limiting on auth endpoints is not implemented (optional per ticket).
- HTTPS is assumed for production deployment (documented here; not enforced in code).
- Demo seed credentials (`admin` / `admin12345`) may still exist via `seed_demo_data`; new users register through `/signup`.
