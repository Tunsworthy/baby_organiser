const express = require('express');
const groupController = require('../controllers/groupController');
const { authMiddleware, requireOwner } = require('../middleware/authMiddleware');

const router = express.Router();

// All group routes require authentication
router.use(authMiddleware);

/**
 * POST /api/groups
 * Create a new group
 */
router.post('/', groupController.createGroup);

/**
 * GET /api/groups
 * List all groups for authenticated user
 */
router.get('/', groupController.listGroups);

/**
 * GET /api/groups/:groupId
 * Get group details with members
 */
router.get('/:groupId', groupController.getGroup);

/**
 * POST /api/groups/:groupId/invite
 * Generate invite code for group (owner only)
 */
router.post('/:groupId/invite', groupController.generateInviteCode);

/**
 * POST /api/groups/invite/accept
 * Accept invite code and join group
 */
router.post('/invite/accept', groupController.acceptInvite);

/**
 * POST /api/groups/:groupId/members
 * Add member to group (owner only)
 */
router.post('/:groupId/members', groupController.addMember);

/**
 * DELETE /api/groups/:groupId/members/:memberId
 * Remove member from group (owner only)
 */
router.delete('/:groupId/members/:memberId', groupController.removeMember);

/**
 * PATCH /api/groups/:groupId/members/:memberId
 * Update member role (owner only)
 */
router.patch('/:groupId/members/:memberId', groupController.updateMemberRole);

module.exports = router;
