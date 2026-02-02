const express = require('express');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

/**
 * PATCH /schedule-items/:itemId
 * Update a single schedule item
 */
router.patch('/:itemId', scheduleController.updateScheduleItem);

/**
 * DELETE /schedule-items/:itemId
 * Delete a single schedule item
 */
router.delete('/:itemId', scheduleController.deleteScheduleItem);

module.exports = router;
