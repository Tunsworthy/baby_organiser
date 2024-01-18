// /routes/alertRoutes.js

const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/alerts', alertController.getAllAlerts); // Get all alerts
router.get('/alerts/active', alertController.getActiveAlerts); // Get all active alerts
router.get('/alerts/:id', alertController.getAlertById); // Get an alert by ID
router.post('/alerts/', alertController.createAlert); // Create a new alert
router.patch('/alerts/:id', alertController.updateAlertById); // Update an alert by ID

module.exports = router;
