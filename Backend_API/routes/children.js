const express = require('express');
const childController = require('../controllers/childController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All child routes require authentication
router.use(authMiddleware);

/**
 * POST /api/children
 * Create a new child in the group
 */
router.post('/', childController.createChild);

/**
 * GET /api/children
 * List all children in the group
 */
router.get('/', childController.listChildren);

/**
 * GET /api/children/:childId
 * Get a specific child
 */
router.get('/:childId', childController.getChild);

/**
 * PATCH /api/children/:childId
 * Update a child
 */
router.patch('/:childId', childController.updateChild);

/**
 * DELETE /api/children/:childId
 * Delete a child
 */
router.delete('/:childId', childController.deleteChild);

module.exports = router;
