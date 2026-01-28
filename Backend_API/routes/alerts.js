const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

router.use(limiter);

router.get('/', alertController.getAllAlerts);
router.get('/active', alertController.getActiveAlerts);
router.get('/:id', alertController.getAlertById);
router.post('/', alertController.createAlert);
router.patch('/:id', alertController.updateAlertById);

module.exports = router;
