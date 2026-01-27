# Backend API Routes

All routes are mounted under the prefix `/api` (see `server.js`). Requests are rate limited to 100 requests per 15 minutes per IP via `express-rate-limit` in each router.

## Food Inventory
- `POST /api/items` — Create a new item.
- `GET /api/items` — List all items.
- `GET /api/items/:id` — Get a single item by ID.
- `PATCH /api/items/:id` — Update an item by ID.
- `DELETE /api/items/:id` — Delete an item by ID.
- `DELETE /api/items` — Delete multiple items.

## Menus
Payload shape: `{ date, type: 'Breakfast'|'Lunch'|'Dinner', items: [{ item_id, name, quantity, allocated, active }] }`
- `GET /api/menus` — List menus (grouped by date/type with aggregated items).
- `POST /api/menus` — Create a menu.
- `GET /api/menus/:id` — Get a menu by ID.
- `GET /api/menus/bydate/:date` — Get menus for a given date (YYYY-MM-DD).
- `PUT /api/menus/:id` — Replace date/type/items for a menu.
- `DELETE /api/menus/:id` — Delete a menu (cascades items).

## Feed Sync
- `GET /api/feed/latest` — Retrieve latest feed sync payload.

## Alerts
- `GET /api/alerts` — List all alerts.
- `GET /api/alerts/active` — List active alerts.
- `GET /api/alerts/:id` — Get an alert by ID.
- `POST /api/alerts` — Create an alert.
- `PATCH /api/alerts/:id` — Update alert status.

## Notes
- Database: PostgreSQL only; Mongo has been removed.
- Tables auto-created on startup via `config/postgrestablecreation.js`.

## Environment Variables
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
	- `INSERT`, `SELECT`, `UPDATE`, `DELETE` on tables `food`, `alerts`, `menus`, `menu_items`, and `nappy_log`.
- On startup, `config/postgrestablecreation.js` will create `food`, `alerts`, `menus`, and `menu_items` if they do not exist.
