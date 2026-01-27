const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

router.use(limiter);

router.get('/alerts', alertController.getAllAlerts);
router.get('/alerts/active', alertController.getActiveAlerts);
router.get('/alerts/:id', alertController.getAlertById);
router.post('/alerts', alertController.createAlert);
router.patch('/alerts/:id', alertController.updateAlertById);

module.exports = router;
