# Admin Control Plane

The admin control plane is a separate app at `apps/admin` intended for `admin.whetiq.com`.

## Purpose
- Identity-managed admin access for multiple managed applications.
- RBAC tiers: `viewer`, `operator`, `super_admin`.
- Runtime mode control per app (`demo` or `private_live`).

## Required Environment Variables
```bash
DATABASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_ISSUER=
ADMIN_AUTH_SECRET=
NEXTAUTH_URL=https://admin.whetiq.com
ADMIN_SUPER_ADMIN_EMAILS=you@company.com
CONTROL_PLANE_SERVICE_TOKEN=long_random_shared_token
```

## Migrations
Run once for each environment before serving traffic:
```bash
npm run -w @mvp/admin migrate
```

## APIs
- `GET /api/settings?appId=<id>`
  - Bearer token required (`CONTROL_PLANE_SERVICE_TOKEN`)
  - Used by managed apps to read runtime mode
- `GET /api/internal/mode?appId=<id>`
  - Requires authenticated admin
- `POST /api/internal/mode`
  - Requires `operator` or `super_admin`
  - Body: `{ "appId": "aggregator-web", "mode": "demo" | "private_live" }`
- `GET /api/internal/users`
  - Requires authenticated admin
- `POST /api/internal/users`
  - Requires `super_admin`
  - Body: `{ "email": "user@company.com", "role": "viewer|operator|super_admin" }`

## Notes
- Data is persisted in Postgres (`DATABASE_URL`) using Drizzle.
- The initial super-admin set is seeded from `ADMIN_SUPER_ADMIN_EMAILS`.
- Managed apps should call `GET /api/settings` and cache mode briefly.
