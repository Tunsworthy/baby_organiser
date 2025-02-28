// /routes/alertRoutes.js

const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

router.get('/alerts', limiter, alertController.getAllAlerts); // Get all alerts
router.get('/alerts/active', limiter, alertController.getActiveAlerts); // Get all active alerts
router.get('/alerts/:id', limiter, alertController.getAlertById); // Get an alert by ID
router.post('/alerts/', limiter, alertController.createAlert); // Create a new alert
router.patch('/alerts/:id', limiter, alertController.updateAlertById); // Update an alert by ID

module.exports = router;
