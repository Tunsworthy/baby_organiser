# Frontend_V2 - Modern Baby Organiser UI

Built with **Vite**, **React**, **Zustand**, and **Tailwind CSS** for a fast, scalable, and responsive interface.

## Features

- **Authentication**: Register, login, and profile management with JWT tokens
- **Food Inventory**: Create, read, update, and delete food items
- **Responsive Design**: Mobile-first Tailwind CSS styling
- **State Management**: Zustand for lightweight, predictable state management
- **API Integration**: Axios with automatic token refresh and error handling
- **Horizontal Scalability**: Stateless frontend for easy horizontal scaling

## Setup

### Prerequisites
- Node.js 18+ or Docker

### Local Development

```bash
# Install dependencies
npm install

# Create .env.local (defaults to http://localhost:3000)
echo "VITE_BACKEND_API_URL=http://localhost:3000" > .env.local

# Start dev server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

**.env.local** (Development):
```
VITE_BACKEND_API_URL=http://localhost:3000
VITE_ENV=development
PORT=5173
```

**.env.production** (Production):
```
VITE_BACKEND_API_URL=https://api.routie.click
VITE_ENV=production
```

## Project Structure

```
Frontend_V2/
├── src/
│   ├── components/
│   │   ├── FoodForm.jsx         # Form for adding/editing food items
│   │   ├── FoodTable.jsx        # Table to display food items
│   │   └── PrivateRoute.jsx     # Protected route wrapper
│   ├── pages/
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration page
│   │   └── FoodInventory.jsx    # Main inventory dashboard
│   ├── services/
│   │   ├── apiClient.js         # Axios instance with interceptors
│   │   └── foodService.js       # API calls for food operations
│   ├── store/
│   │   ├── authStore.js         # Auth state (Zustand)
│   │   └── foodStore.js         # Food inventory state (Zustand)
│   ├── App.jsx                  # Router setup
│   ├── main.jsx                 # Entry point
│   └── index.css                # Tailwind imports
├── public/
├── index.html                   # HTML template
├── vite.config.js               # Vite configuration (HTTPS/HTTP)
├── tailwind.config.js           # Tailwind CSS configuration
├── Dockerfile                   # Multi-stage Docker build
└── nginx.conf                   # Nginx config for static serving

```

## API Integration

All API calls use the `apiClient` which:
1. Automatically includes the `Authorization` header with JWT token
2. Sends `withCredentials: true` for httpOnly cookies
3. Intercepts 401 responses to refresh tokens
4. Redirects to login on refresh failure

### Available Services

**authService**:
- `login(email, password)`
- `register(email, password, firstName, lastName)`
- `logout()`
- `getProfile()`
- `refreshToken()`

**foodService**:
- `getAllItems()`
- `getItem(id)`
- `createItem(itemData)`
- `updateItem(id, itemData)`
- `deleteItem(id)`
- `deleteMultipleItems(ids)`

## State Management with Zustand

### Auth Store
```javascript
const { user, accessToken, isLoading, error, login, register, logout } = useAuthStore()
```

### Food Store
```javascript
const { items, isLoading, error, fetchItems, addItem, updateItem, deleteItem } = useFoodStore()
```

## Docker Deployment

### Build Image
```bash
docker build -t frontend_v2:latest .
```

### Run Container
```bash
docker run -d \
  --name frontend_v2 \
  -p 3001:80 \
  -e VITE_BACKEND_API_URL=http://backend_api:3000 \
  frontend_v2:latest
```

### Docker Compose
```yaml
frontend_v2:
  build: ./Frontend_V2
  ports:
    - "3001:80"
  environment:
    VITE_BACKEND_API_URL: http://backend_api:3000
  depends_on:
    - backend_api
```

## HTTPS Support

For development with HTTPS, set environment variables:
```bash
export SSL_KEY_PATH=/path/to/key.pem
export SSL_CERT_PATH=/path/to/cert.pem
npm run dev
```

Falls back to HTTP on 5173 if certificates are not provided.

## Styling

Uses **Tailwind CSS** utility-first approach. Customize theme in `tailwind.config.js`.

Common utility classes:
- Spacing: `px-4`, `py-2`, `m-6`, etc.
- Colors: `bg-blue-600`, `text-gray-700`, etc.
- Responsive: `md:px-8`, `lg:max-w-6xl`, etc.
- Flexbox: `flex`, `justify-between`, `items-center`, etc.

## Performance

- **Code Splitting**: Vite automatically splits routes
- **Tree-shaking**: Unused code removed from production builds
- **Caching**: Static files cached for 1 year; index.html must be revalidated
- **Gzip**: Nginx compresses responses (enabled in nginx.conf)
- **Minification**: Production builds automatically minified

## Common Issues

### 401 Unauthorized after token refresh
- Check that Backend API is running on correct port/URL
- Ensure `VITE_BACKEND_API_URL` environment variable is set correctly
- Verify `withCredentials: true` and CORS are enabled on Backend

### CORS errors
- Backend CORS middleware should allow Frontend_V2 origin
- Set `FRONTEND_URL` environment variable on Backend API
- Ensure `credentials: true` in CORS config

### API calls returning 404
- Verify route paths match Backend API route definitions
- Check `VITE_BACKEND_API_URL` is correct
- Review Network tab in browser DevTools

## Next Steps

- Add menu management pages
- Implement child/family member management
- Add group/family invitation system
- Implement alerts and notifications
- Add data export/backup features
-update