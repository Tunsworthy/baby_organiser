const express = require('express');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

/**
 * GET /schedules?childId=123
 * List schedules for a child
 */
router.get('/', scheduleController.listSchedules);

/**
 * POST /schedules
 * Create schedule
 */
router.post('/', scheduleController.createSchedule);

/**
 * GET /schedules/:scheduleId
 * Get schedule with items
 */
router.get('/:scheduleId', scheduleController.getSchedule);

/**
 * PUT /schedules/:scheduleId
 * Update schedule
 */
router.put('/:scheduleId', scheduleController.updateSchedule);

/**
 * POST /schedules/:scheduleId/activate
 * Activate schedule for child
 */
router.post('/:scheduleId/activate', scheduleController.activateSchedule);

/**
 * DELETE /schedules/:scheduleId
 * Delete schedule
 */
router.delete('/:scheduleId', scheduleController.deleteSchedule);

/**
 * POST /schedules/:scheduleId/copy
 * Copy schedule to another child
 */
router.post('/:scheduleId/copy', scheduleController.copySchedule);

/**
 * POST /schedules/:scheduleId/items
 * Create schedule item
 */
router.post('/:scheduleId/items', scheduleController.createScheduleItem);

module.exports = router;
