# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # API server (port 3001) + React app (port 3000) concurrently
npm run start:api  # API server only
npm run start:app  # React app only
npm run build      # Production build
npm test           # Jest tests
```

## Architecture

This is a React 19 + TypeScript SPA for workplace resource management (meeting rooms, devices, reservations). The backend is a json-server mock API.

### Backend (`server.js`)

- json-server serves `db.json` (persisted) for CRUD: `/rooms`, `/reservations`, `/devices`, `/loans`, `/users`
- `db-history.json` is read once at startup and mounted as read-only: `/reservationHistory`, `/loanHistory`
- Frontend proxies unknown requests to `:3001` (configured in `package.json`)

### Frontend State (`src/contexts/`)

Two React Context providers wrap the entire app:

- **AuthContext** – current user session (`username`, `role: 'user'|'admin'`, `displayName`). Session persisted in `sessionStorage` under key `we-sample-auth`. Login validates against `/users` API. Test credentials: `user/user123`, `admin/admin123`.
- **DataContext** – global data arrays (`rooms[]`, `devices[]`, `reservations[]`, `loans[]`, `users[]`) plus CRUD methods (`addRoom`, `cancelReservation`, `borrowDevice`, `returnDevice`, etc.). Loads all data on mount via `reload()`.

### Routing (`src/App.tsx`)

All routes except `/login` are wrapped in `<ProtectedRoute>` (redirects to `/login` if unauthenticated). Admin-only pages additionally pass `requireRole="admin"`:

| Path | Role required |
|------|--------------|
| `/rooms/register` | admin |
| `/devices/register` | admin |
| `/loans` | admin |
| `/users` | admin |

### API Client (`src/api.ts`)

Generic `request<T>()` fetch wrapper. IDs are generated client-side via `generateId(prefix)` (prefix + timestamp + random). Cascade deletions (`deleteReservationsByRoom`, `deleteLoanByDevice`) are handled here, not in the server.

### Types (`src/types.ts`)

- `Device.status`: `'available' | 'inUse' | 'maintenance'`
- `DeviceType`: `'ノートPC' | 'プロジェクター' | 'Web会議機器' | 'モニター' | 'その他'`
- `User` (session) vs `UserRecord` (DB record with `id` and `password`) are distinct types
