# Backend API Routes

All routes are mounted under the prefix `/api` (see `server.js`). Most routes require authentication via JWT token in the `Authorization: Bearer <token>` header. Requests are rate limited to 100 requests per 15 minutes per IP via `express-rate-limit` in each router.

## Authentication
All authentication routes are **public** (no token required).

- `POST /api/auth/register` — Register a new user. Auto-creates a default group. Returns JWT access token and refresh token.
  - Body: `{ email, password, firstName?, lastName?, authProvider?: 'local'|'auth0' }`
- `POST /api/auth/login` — Login with email and password. Returns JWT access token and refresh token.
  - Body: `{ email, password }`
- `POST /api/auth/refresh` — Refresh access token using refresh token.
  - Body: `{ refreshToken }`
- `GET /api/auth/profile` — Get current user's profile and groups. **Requires authentication.**

## Groups (Family Management)
All group routes **require authentication**.

- `POST /api/groups` — Create a new group.
  - Body: `{ name }`
- `GET /api/groups` — List all groups for authenticated user.
- `GET /api/groups/:groupId` — Get group details with members.
- `POST /api/groups/:groupId/invite` — Generate invite code for group. **Owner only.**
- `POST /api/groups/invite/accept` — Accept invite code and join group.
  - Body: `{ inviteCode }`
- `POST /api/groups/:groupId/members` — Add member to group by email. **Owner only.**
  - Body: `{ email, role?: 'owner'|'member' }`
- `DELETE /api/groups/:groupId/members/:memberId` — Remove member from group. **Owner only.**
- `PATCH /api/groups/:groupId/members/:memberId` — Update member role. **Owner only.**
  - Body: `{ role: 'owner'|'member' }`

## Children
All children routes **require authentication**. Children are scoped to the authenticated user's group.

- `POST /api/children` — Create a child in the group.
  - Body: `{ name }`
- `GET /api/children` — List all children in the group.
- `GET /api/children/:childId` — Get a specific child.
- `PATCH /api/children/:childId` — Update a child's name.
  - Body: `{ name }`
- `DELETE /api/children/:childId` — Delete a child.

## Food Inventory
All food inventory routes **require authentication**. Items are scoped to the authenticated user's group.
- `POST /api/items` — Create a new item.
- `GET /api/items` — List all items.
- `GET /api/items/:id` — Get a single item by ID.
- `PATCH /api/items/:id` — Update an item by ID.
- `DELETE /api/items/:id` — Delete an item by ID.
- `DELETE /api/items` — Delete multiple items.

## Menus
All menu routes **require authentication**. Menus are scoped to the authenticated user's group. Menus can be assigned to specific children.

Payload shape: `{ date, type: 'Breakfast'|'Lunch'|'Dinner', childId?, items: [{ food_id, quantity, allocated?, active? }] }`
- `GET /api/menus` — List menus (grouped by date/type with aggregated items).
- `POST /api/menus` — Create a menu.
- `GET /api/menus/:id` — Get a menu by ID.
- `GET /api/menus/bydate/:date` — Get menus for a given date (YYYY-MM-DD).
- `PUT /api/menus/:id` — Replace date/type/items for a menu.
- `DELETE /api/menus/:id` — Delete a menu (cascades items).

## Feed Sync
- `GET /api/feed/latest` — Retrieve latest feed sync payload.

## Alerts
All alert routes **require authentication**. Alerts can be user-scoped or group-scoped. Users see both their personal alerts and group-wide alerts.

- `GET /api/alerts` — List all alerts (user-scoped + group-scoped).
- `GET /api/alerts/active` — List active alerts (user-scoped + group-scoped).
- `GET /api/alerts/:id` — Get an alert by ID.
- `POST /api/alerts` — Create an alert.
  - Body: `{ name, type, message, status?: 'active'|'inactive', targetUserId?, isGroupAlert?: boolean }`
  - If `isGroupAlert=true`, alert is visible to all group members. If `targetUserId` is set, alert is visible only to that user.
- `PATCH /api/alerts/:id` — Update alert status (e.g., dismiss alert).
  - Body: `{ status: 'active'|'inactive' }`

## Notes
- **Authentication**: Most routes require a valid JWT token in the `Authorization: Bearer <token>` header. Public routes: `/api/auth/*`.
- **Multi-Tenancy**: All data (food, menus, alerts) is scoped to groups. Users can belong to multiple groups with different roles.
- **Roles**: `owner` (can manage members, delete group) and `member` (can create/edit data).
- Database: PostgreSQL only; Mongo has been removed.
- Tables auto-created on startup via `config/postgrestablecreation.js`.

## Environment Variables
- `JWT_SECRET` — Secret key for signing JWT tokens. **Required for authentication.**
- `AUTH0_DOMAIN` — Auth0 domain (optional, for future Auth0 integration).
- `AUTH0_AUDIENCE` — Auth0 API audience (optional, for future Auth0 integration).
- `POSTGRES_URI` — Connection string for main Postgres database.
- `POSTGRES_FEEDSNYC` — Connection string for feedsync Postgres database.
- `PORT` — HTTP port (fallback when HTTPS is not enabled). Defaults to `3000`.
- `HTTPS_PORT` — HTTPS port (defaults to `PORT`) used when SSL certs are present.
- `SSL_KEY_PATH` — Absolute or relative path to TLS private key (PEM). HTTPS enabled only if both key and cert exist.
- `SSL_CERT_PATH` — Path to TLS certificate (PEM).
- `SSL_CA_PATH` — Optional path to CA bundle (PEM) for HTTPS chain.
- `AUTH0_ISSUER_BASE_URL` — Auth0 issuer URL (if Auth0 middleware is used in the future).
- `AUTH0_CLIENT_ID` — Auth0 client ID.
- `BASE_URL` — Base URL for callbacks (e.g., `http://localhost:4040`).
- `SESSION_SECRET` — Session/signing secret if session middleware is enabled.

## Database Setup (PostgreSQL)
- Create a database (e.g., `postgres`) and a user with privileges to create/alter tables and read/write data.
- Example superuser/local dev: `postgres` / `password` (matches the default URIs in `.env`).
- Minimum required permissions for the configured user:
	- `CONNECT` on the database.
	- `CREATE` on the database (to allow `CREATE TABLE IF NOT EXISTS`).
	- `INSERT`, `SELECT`, `UPDATE`, `DELETE` on tables.
- On startup, `config/postgrestablecreation.js` will create the following tables if they do not exist:
	- **Auth & Multi-Tenancy**: `users`, `groups`, `user_groups`, `children`
	- **Data**: `food`, `alerts`, `menus`, `menu_items`
	- **Feed Sync**: `nappy_log` (separate database via `POSTGRES_FEEDSNYC`)

## Schema Overview
- **users**: `id`, `email`, `passwordHash`, `firstName`, `lastName`, `authProvider` ('local' or 'auth0'), timestamps
- **groups**: `id`, `name`, `ownerId` (FK to users), `createdAt`
- **user_groups**: `userId` (FK), `groupId` (FK), `role` ('owner' or 'member'), composite PK
- **children**: `id`, `name`, `groupId` (FK), `createdBy` (FK to users), timestamps
- **food**: `id`, `name`, `quantity`, `dateprepared`, `type`, `lastallocated`, `groupId` (FK), `createdBy` (FK)
- **menus**: `id`, `name`, `date`, `type` (Breakfast/Lunch/Dinner), `description`, `status`, `groupId` (FK), `childId` (FK), `createdBy` (FK), `createddate`
- **menu_items**: `id`, `menu_id` (FK), `food_id` (FK), `quantity`, `allocated`, `active`, `created_at`
- **alerts**: `id`, `name`, `type`, `message`, `status` (active/inactive), `groupId` (FK), `userId` (FK, optional), `createdBy` (FK), `isGroupAlert` (boolean), `createddate`
