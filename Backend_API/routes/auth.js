const express = require('express');
const userController = require('../controllers/userController');
const { rateLimitLogin, clearLoginAttempts, authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /auth/register
 * Register a new user with email and password
 */
router.post('/register', rateLimitLogin, userController.register);

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', rateLimitLogin, clearLoginAttempts, userController.login);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', userController.refreshToken);

/**
 * GET /auth/profile
 * Get current authenticated user's profile
 */
router.get('/profile', authMiddleware, userController.getProfile);

module.exports = router;
