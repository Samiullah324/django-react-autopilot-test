# Task #18 — Implement Dark Mode

## Scope

Add full dark/light theme support across the React frontend: global theme state, persisted user preference, accessible toggle, CSS variable palettes, smooth transitions, and tests.

## Key decisions

- **CSS custom properties** on `[data-theme='light'|'dark']` remain the single styling mechanism; components use semantic tokens (`--bg`, `--text`, `--primary`, etc.) rather than hardcoded colors.
- **Default theme is light** when no `localStorage` value exists (per ticket spec), replacing the prior `prefers-color-scheme` fallback.
- **`initTheme()` in `main.tsx`** runs before React mount to avoid a flash of the wrong theme on first paint.
- **`ThemeToggle`** is a dedicated accessible component (`role="switch"`, `aria-checked`, descriptive `aria-label`) reused in the navbar and login page.
- **Smooth transitions** use a shared `--transition-theme` token applied to body and major surfaces so theme switches animate without layout shifts.
- **Vitest + Testing Library** added for frontend theme tests (no prior frontend test setup existed).

## Files changed

| File | Why |
|------|-----|
| `frontend/src/context/ThemeContext.tsx` | Exported `THEME_STORAGE_KEY`, default to light, centralized `readStoredTheme` |
| `frontend/src/context/ThemeContext.test.tsx` | Tests for default, persistence, and toggle behavior |
| `frontend/src/components/ThemeToggle.tsx` | New accessible sun/moon toggle component |
| `frontend/src/components/ThemeToggle.test.tsx` | Tests for ARIA semantics and toggle interaction |
| `frontend/src/components/Navbar.tsx` | Uses `ThemeToggle` in header |
| `frontend/src/pages/LoginPage.tsx` | Uses `ThemeToggle` on login screen |
| `frontend/src/main.tsx` | Imports shared storage key, defaults to light |
| `frontend/src/styles/global.css` | Theme tokens for sidebar/banner borders, smooth transitions |
| `frontend/src/test/setup.ts` | Vitest setup (localStorage + DOM reset) |
| `frontend/vite.config.ts` | Vitest configuration |
| `frontend/package.json` | Test script and dev dependencies |
| `frontend/tsconfig.json` | Vitest global types |

## Open questions / follow-ups

- Recharts tooltips use inline styles with CSS variables; charts re-read tokens on re-render. If chart colors lag behind theme toggles in some browsers, consider subscribing to `useTheme()` on `DashboardPage` to force a chart remount.
- CI workflow currently runs placeholder checks only; frontend `npm test` / `npm run build` are not yet wired into `.github/workflows/ci.yml`.

## Verification

```bash
cd frontend && npm install && npm run typecheck && npm test && npm run build
cd backend && python3 manage.py test inventory.tests
```
