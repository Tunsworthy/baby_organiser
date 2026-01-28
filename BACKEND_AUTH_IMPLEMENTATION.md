# Backend Auth Implementation - Testing Guide

## Overview
Implemented JWT-based local auth with pluggable Auth0 support, multi-tenant groups, and role-based access control.

## What Was Implemented

### 1. Database Schema Updates ([Backend_API/config/postgrestablecreation.js](../Backend_API/config/postgrestablecreation.js))
- Added `users` table (email, passwordHash, authProvider, timestamps)
- Added `groups` table (name, ownerId, timestamps)
- Added `user_groups` junction table (userId, groupId, role: 'owner'|'member')
- Added `children` table (name, groupId, createdBy, timestamps)
- Updated `food`, `menus`, `alerts` tables with `groupId`, `userId`, `createdBy` columns

### 2. Authentication Layer ([Backend_API/middleware/authMiddleware.js](../Backend_API/middleware/authMiddleware.js))
- JWT verification (local + pluggable Auth0 support)
- Rate limiting on login (5 attempts per IP per 15 minutes)
- `authMiddleware`: validates Bearer token and attaches `req.user`
- `requireOwner`: checks for owner role

### 3. User Management ([Backend_API/controllers/userController.js](../Backend_API/controllers/userController.js) + [Backend_API/routes/auth.js](../Backend_API/routes/auth.js))
- `POST /api/auth/register`: Create user + auto-create default group
- `POST /api/auth/login`: Email/password login, return JWT + refresh token
- `POST /api/auth/refresh`: Refresh access token
- `GET /api/auth/profile`: Get user profile (requires auth)

### 4. Group Management ([Backend_API/controllers/groupController.js](../Backend_API/controllers/groupController.js) + [Backend_API/routes/groups.js](../Backend_API/routes/groups.js))
- `POST /api/groups`: Create group (auth required)
- `GET /api/groups`: List user's groups (auth required)
- `GET /api/groups/:groupId`: Get group details + members (auth required)
- `POST /api/groups/:groupId/members`: Add member (owner only)
- `DELETE /api/groups/:groupId/members/:memberId`: Remove member (owner only)
- `PATCH /api/groups/:groupId/members/:memberId`: Update member role (owner only)
- `POST /api/groups/:groupId/invite`: Generate invite code (owner only)

### 5. Children Management ([Backend_API/controllers/childController.js](../Backend_API/controllers/childController.js) + [Backend_API/routes/children.js](../Backend_API/routes/children.js))
- `POST /api/children`: Create child in group (auth required)
- `GET /api/children`: List group's children (auth required)
- `GET /api/children/:childId`: Get specific child (auth required)
- `PATCH /api/children/:childId`: Update child (auth required)
- `DELETE /api/children/:childId`: Delete child (auth required)

### 6. Updated Existing Controllers with Multi-Tenancy

#### Food Controller ([Backend_API/controllers/foodController.js](../Backend_API/controllers/foodController.js))
- All queries filtered by `WHERE groupId = req.user.groupId`
- CREATE includes `groupId` + `createdBy` from authenticated user

#### Menu Controller ([Backend_API/controllers/menuController.js](../Backend_API/controllers/menuController.js))
- All queries filtered by group
- Added `childId` and `createdBy` columns
- Updated schema to include `date` column (was missing)
- Menu items linked to specific children

#### Alert Controller ([Backend_API/controllers/alertController.js](../Backend_API/controllers/alertController.js))
- Alerts scoped by user (`userId = req.user.id`) OR group (`groupId = req.user.groupId AND isGroupAlert = true`)
- Support for both user-scoped and group-scoped alerts
- CREATE includes `groupId`, `userId` (optional), `createdBy`, `isGroupAlert`

### 7. Server Configuration ([Backend_API/server.js](../Backend_API/server.js))
- Explicit route registration (no auto-loading)
- Public routes: `/api/auth` (register, login, refresh)
- Protected routes: `/api/groups`, `/api/children`, `/api/items`, `/api/menus`, `/api/alerts`
- Health check endpoint: `GET /health`
- Error handling for 404 and unhandled errors

## Quick Testing

### 1. Start Backend
```bash
cd Backend_API
npm start
```
Expected: Server listens on port 3000

### 2. Test Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```
Expected: User created, default group created, JWT tokens returned

### 3. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "securePassword123"
  }'
```
Expected: Access token + refresh token returned

### 4. Test Protected Route (with token)
```bash
# Replace TOKEN with actual accessToken from login response
curl -X GET http://localhost:3000/api/groups \
  -H "Authorization: Bearer TOKEN"
```
Expected: User's groups returned

### 5. Test Create Child
```bash
curl -X POST http://localhost:3000/api/children \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emma"
  }'
```
Expected: Child created with groupId from authenticated user

### 6. Test Food Item (Group-Scoped)
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Milk",
    "quantity": 2,
    "type": "Beverage",
    "dateprepared": "2026-01-28"
  }'
```
Expected: Item created with groupId from authenticated user

### 7. Test Create Alert (Group-Scoped)
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Low Milk",
    "type": "inventory",
    "message": "Milk running low",
    "status": "active",
    "isGroupAlert": true
  }'
```
Expected: Alert created for entire group

## Key Design Decisions

### 1. Token Storage in Frontend (Next Phase)
- Local JWT `accessToken` in memory or localStorage (short-lived: 1 hour)
- Refresh token in httpOnly cookie (long-lived: 7 days)
- Client sends `Authorization: Bearer <accessToken>` header

### 2. Auth0 Integration Path (Future)
- Replace `/api/auth/login` to accept Auth0 token
- Update `authMiddleware` to validate Auth0 JWT signature instead of local JWT
- User sets `authProvider='auth0'` at signup
- No database password storage for Auth0 users

### 3. Multi-Tenant Safety
- Every query filtered by `groupId` to prevent cross-group data leaks
- Alerts support both user-scoped and group-scoped visibility
- Menus linked to specific children within groups
- Rate limiting prevents brute force attacks

### 4. CORS Configuration (Next Phase)
- Backend_API needs CORS middleware to accept requests from Frontend
- Add to server.js: `app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))`

## Environment Variables Needed

Add to `.env`:
```
JWT_SECRET=your-super-secret-key-change-in-production
PORT=3000
POSTGRES_URI=postgresql://user:password@host:5432/babyorg
POSTGRES_FEEDSYNC=postgresql://user:password@host:5432/feedsync

# Optional Auth0 (future)
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-api-audience
```

## Files Modified/Created

### New Files
- [Backend_API/middleware/authMiddleware.js](../Backend_API/middleware/authMiddleware.js)
- [Backend_API/controllers/userController.js](../Backend_API/controllers/userController.js)
- [Backend_API/routes/auth.js](../Backend_API/routes/auth.js)
- [Backend_API/controllers/groupController.js](../Backend_API/controllers/groupController.js)
- [Backend_API/routes/groups.js](../Backend_API/routes/groups.js)
- [Backend_API/controllers/childController.js](../Backend_API/controllers/childController.js)
- [Backend_API/routes/children.js](../Backend_API/routes/children.js)

### Modified Files
- [Backend_API/config/postgrestablecreation.js](../Backend_API/config/postgrestablecreation.js) - Added schema for auth
- [Backend_API/controllers/foodController.js](../Backend_API/controllers/foodController.js) - Added groupId filtering
- [Backend_API/controllers/menuController.js](../Backend_API/controllers/menuController.js) - Added groupId + childId filtering
- [Backend_API/controllers/alertController.js](../Backend_API/controllers/alertController.js) - Added user/group filtering
- [Backend_API/server.js](../Backend_API/server.js) - Explicit route registration + auth middleware
- [Backend_API/package.json](../Backend_API/package.json) - Added bcryptjs + jsonwebtoken

## Next Steps

1. **Database Migration**: Run the backend to create/update tables (happens automatically on startup)
2. **Frontend Integration**: Remove proxy routes from Frontend, add client-side JWT handling
3. **Nginx Configuration**: Add `/api` upstream block to route to Backend_API
4. **Testing**: Test full auth flow end-to-end with Frontend
5. **CORS Setup**: Add CORS middleware to Backend_API for cross-origin Frontend requests
6. **Auth0 Integration** (Phase 2): Swap local auth for Auth0 SDK
