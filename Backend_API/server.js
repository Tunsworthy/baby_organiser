require('dotenv').config();
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const ensurepostgresTablesExists = require('./config/postgrestablecreation');

const { pool , feedsync } = require('./config/postgresConnection.js');
const { authMiddleware } = require('./middleware/authMiddleware');

// Import route handlers
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const childRoutes = require('./routes/children');
const foodRoutes = require('./routes/foodRoutes');
const menuRoutes = require('./routes/menus');
const alertRoutes = require('./routes/alerts');
const scheduleRoutes = require('./routes/schedules');
const scheduleItemsRoutes = require('./routes/scheduleItems');
const feedsyncRoutes = require('./routes/feedsyncRoutes');

// Add error handling for both pools
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle main pool client', err);
});

feedsync.on('error', (err, client) => {
  console.error('Unexpected error on idle feedsync pool client', err);
});
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware for parsing JSON and form data
app.use(bodyParser.urlencoded({ extended: true,limit: '100mb' }));
app.use(bodyParser.json());
app.use(cookieParser());

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/children', authMiddleware, childRoutes);
app.use('/api/items', authMiddleware, foodRoutes);
app.use('/api/menus', authMiddleware, menuRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/schedules', authMiddleware, scheduleRoutes);
app.use('/api/schedule-items', authMiddleware, scheduleItemsRoutes);
app.use('/api/feed', feedsyncRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

// Run the function to make sure the "food" table exists
ensurepostgresTablesExists().then(() => {
  console.log('Table check is complete.');
}).catch(err => {
  console.error('Failed to check/create table:', err);
});

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || PORT;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH ? path.resolve(process.env.SSL_KEY_PATH) : null;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH ? path.resolve(process.env.SSL_CERT_PATH) : null;
const SSL_CA_PATH = process.env.SSL_CA_PATH ? path.resolve(process.env.SSL_CA_PATH) : null;

const hasKey = SSL_KEY_PATH && fs.existsSync(SSL_KEY_PATH);
const hasCert = SSL_CERT_PATH && fs.existsSync(SSL_CERT_PATH);
const hasCa = SSL_CA_PATH && fs.existsSync(SSL_CA_PATH);

if (hasKey && hasCert) {
  try {
    const options = {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH),
    };
    if (hasCa) {
      options.ca = fs.readFileSync(SSL_CA_PATH);
    }
    https.createServer(options, app).listen(HTTPS_PORT, () => {
      console.log(`HTTPS server running on port ${HTTPS_PORT}`);
    });
  } catch (err) {
    console.warn(`Failed to load SSL certificates: ${err.message}`);
    console.log(`Falling back to HTTP server on port ${PORT}`);
    app.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`));
  }
} else {
  app.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`));
}

//Comment to rebuild