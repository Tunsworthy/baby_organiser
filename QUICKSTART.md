# Quick Start - Frontend_V2

## 5-Minute Setup

### Step 1: Install Backend Dependencies
```bash
cd Backend_API
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd ../Frontend_V2
npm install
```

### Step 3: Start Backend (Terminal 1)
```bash
cd Backend_API
npm run start_local
```

You should see: `Backend API is running on port 3000`

### Step 4: Start Frontend (Terminal 2)
```bash
cd Frontend_V2
npm run dev
```

You should see: `VITE v5.0.0 ready in XXX ms ➜  Local:   http://localhost:5173/`

### Step 5: Open in Browser
Visit: **http://localhost:5173**

## Test Workflow

1. **Register** (http://localhost:5173/register)
   - Email: `test@example.com`
   - Password: `TestPassword123` (min 8 chars)
   - First Name: `John`
   - Last Name: `Doe`

2. **Dashboard** (redirects automatically after login)
   - Welcome message shows your name
   - "Add Item" button visible

3. **Add Food Item**
   - Click "Add Item"
   - Fill in: Name, Quantity, Unit, Category, Notes
   - Click "Save Item"

4. **View Items**
   - Item appears in table below
   - Edit/Delete buttons available

5. **Logout**
   - Click "Logout" button
   - Redirected to login page
   - PrivateRoute blocks direct dashboard access

## Key Features Working

✅ User registration with auto-group creation  
✅ User login with JWT tokens  
✅ Food inventory CRUD (Create, Read, Update, Delete)  
✅ Automatic token refresh on 401  
✅ Protected routes (PrivateRoute component)  
✅ Form validation with error messages  
✅ Responsive UI with Tailwind CSS  
✅ httpOnly refresh token cookies  
✅ CORS enabled between Frontend & Backend  

## Common Commands

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview

# Check for syntax errors
npm run lint

# Clean install (if dependencies broken)
rm -rf node_modules package-lock.json
npm install
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| CORS error | Backend not running or wrong API URL in .env.local |
| 404 Not Found | Backend route missing (check Backend_API/server.js) |
| 401 Unauthorized | Access token expired or invalid (try logout/login) |
| Cannot find module | Run `npm install` in that directory |
| Port already in use | Change port in vite.config.js or kill process on port 5173/3000 |

## Next: Explore the Code

**Auth Flow**:
- [authStore.js](Frontend_V2/src/store/authStore.js) - Login/register logic
- [Login.jsx](Frontend_V2/src/pages/Login.jsx) - Login UI
- [PrivateRoute.jsx](Frontend_V2/src/components/PrivateRoute.jsx) - Route protection

**Food Inventory**:
- [foodStore.js](Frontend_V2/src/store/foodStore.js) - CRUD operations
- [FoodInventory.jsx](Frontend_V2/src/pages/FoodInventory.jsx) - Main page
- [FoodForm.jsx](Frontend_V2/src/components/FoodForm.jsx) - Add/edit form
- [FoodTable.jsx](Frontend_V2/src/components/FoodTable.jsx) - Items display

**API Integration**:
- [apiClient.js](Frontend_V2/src/services/apiClient.js) - Axios with interceptors
- [foodService.js](Frontend_V2/src/services/foodService.js) - API calls

## For Production Deployment

See [FRONTEND_V2_IMPLEMENTATION.md](FRONTEND_V2_IMPLEMENTATION.md#docker-deployment) for Docker setup.

```bash
# Build Docker image
docker build -t frontend_v2:latest ./Frontend_V2

# Run with Docker
docker run -d -p 3001:80 -e VITE_BACKEND_API_URL=http://backend_api:3000 frontend_v2:latest
```

---

**Ready to build?** Start modifying components in `Frontend_V2/src/` and hot-reload will instantly show changes in the browser!
