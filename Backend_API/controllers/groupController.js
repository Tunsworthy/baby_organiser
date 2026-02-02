const crypto = require('crypto');
const { pool } = require('../config/postgresConnection');

const INVITE_CODE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Create a new group
 */
async function createGroup(req, res) {
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create group
    const groupResult = await client.query(
      `INSERT INTO groups (name, ownerId)
       VALUES ($1, $2)
       RETURNING id, name, ownerId, createdAt`,
      [name, userId]
    );

    const group = groupResult.rows[0];

    // Add owner to group
    await client.query(
      `INSERT INTO user_groups (userId, groupId, role)
       VALUES ($1, $2, $3)`,
      [userId, group.id, 'owner']
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        id: group.id,
        name: group.name,
        ownerId: group.ownerid,
        createdAt: group.createdat
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Failed to create group' });
  } finally {
    client.release();
  }
}

/**
 * Get all groups for authenticated user
 */
async function listGroups(req, res) {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT g.id, g.name, g.ownerId, g.createdAt, ug.role,
              (SELECT COUNT(*) FROM user_groups WHERE groupId = g.id) as memberCount
       FROM groups g
       JOIN user_groups ug ON g.id = ug.groupId
       WHERE ug.userId = $1
       ORDER BY g.createdAt DESC`,
      [userId]
    );

    res.json({
      groups: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        ownerId: row.ownerid,
        role: row.role,
        memberCount: parseInt(row.membercount),
        createdAt: row.createdat
      }))
    });
  } catch (err) {
    console.error('List groups error:', err);
    res.status(500).json({ error: 'Failed to list groups' });
  }
}

/**
 * Get group details with members
 */
async function getGroup(req, res) {
  const { groupId } = req.params;
  const userId = req.user.userId;

  try {
    // Verify user is member of group
    const memberResult = await pool.query(
      `SELECT role FROM user_groups WHERE userId = $1 AND groupId = $2`,
      [userId, groupId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get group details
    const groupResult = await pool.query(
      `SELECT id, name, ownerId, createdAt FROM groups WHERE id = $1`,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get members
    const membersResult = await pool.query(
      `SELECT u.id, u.email, u.firstName, u.lastName, ug.role
       FROM user_groups ug
       JOIN users u ON ug.userId = u.id
       WHERE ug.groupId = $1
       ORDER BY ug.role DESC, u.email`,
      [groupId]
    );

    const group = groupResult.rows[0];
    res.json({
      group: {
        id: group.id,
        name: group.name,
        ownerId: group.ownerid,
        createdAt: group.createdat
      },
      members: membersResult.rows.map(row => ({
        id: row.id,
        email: row.email,
        firstName: row.firstname,
        lastName: row.lastname,
        role: row.role
      }))
    });
  } catch (err) {
    console.error('Get group error:', err);
    res.status(500).json({ error: 'Failed to get group' });
  }
}

/**
 * Generate invite code for group
 */
async function generateInviteCode(req, res) {
  const { groupId } = req.params;
  const userId = req.user.userId;

  try {
    // Check if user is owner
    const ownerResult = await pool.query(
      `SELECT role FROM user_groups WHERE userId = $1 AND groupId = $2`,
      [userId, groupId]
    );

    if (ownerResult.rows.length === 0 || ownerResult.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only group owners can generate invite codes' });
    }

    const inviteCode = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_CODE_EXPIRY);

    // Store invite code in database
    await pool.query(
      `INSERT INTO group_invites (inviteCode, groupId, createdBy, expiresAt) 
       VALUES ($1, $2, $3, $4)`,
      [inviteCode, groupId, userId, expiresAt]
    );

    res.json({
      invite_code: inviteCode,
      expiresAt,
      groupId,
      message: 'Share this invite code with new members'
    });
  } catch (err) {
    console.error('Generate invite code error:', err);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
}

/**
 * Accept invite code and join group
 */
async function acceptInvite(req, res) {
  const { invite_code } = req.body;
  const userId = req.user.userId;

  if (!invite_code) {
    return res.status(400).json({ error: 'Invite code is required' });
  }

  try {
    // Validate invite code
    const inviteResult = await pool.query(
      `SELECT * FROM group_invites 
       WHERE inviteCode = $1 AND expiresAt > NOW() AND usedBy IS NULL`,
      [invite_code]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invite code' });
    }

    const invite = inviteResult.rows[0];
    const groupId = invite.groupid;

    // Check if user is already a member
    const memberCheck = await pool.query(
      `SELECT * FROM user_groups WHERE userId = $1 AND groupId = $2`,
      [userId, groupId]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You are already a member of this group' });
    }

    // Add user to group
    await pool.query(
      `INSERT INTO user_groups (userId, groupId, role) VALUES ($1, $2, 'member')`,
      [userId, groupId]
    );

    // Mark invite as used
    await pool.query(
      `UPDATE group_invites SET usedBy = $1, usedAt = NOW() WHERE id = $2`,
      [userId, invite.id]
    );

    // Get group details
    const groupResult = await pool.query(
      `SELECT * FROM groups WHERE id = $1`,
      [groupId]
    );

    res.json({
      message: 'Successfully joined group',
      group: groupResult.rows[0]
    });
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
}

/**
 * Add member to group (owner only)
 */
async function addMember(req, res) {
  const { groupId } = req.params;
  const { email, role = 'member' } = req.body;
  const userId = req.user.userId;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!['owner', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const client = await pool.connect();
  try {
    // Check if user is owner
    const ownerResult = await client.query(
      `SELECT role FROM user_groups WHERE userId = $1 AND groupId = $2`,
      [userId, groupId]
    );

    if (ownerResult.rows.length === 0 || ownerResult.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only group owners can add members' });
    }

    // Find user by email
    const userResult = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newMemberId = userResult.rows[0].id;

    // Check if already member
    const existingMember = await client.query(
      `SELECT id FROM user_groups WHERE userId = $1 AND groupId = $2`,
      [newMemberId, groupId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({ error: 'User is already a member of this group' });
    }

    // Add member
    await client.query(
      `INSERT INTO user_groups (userId, groupId, role)
       VALUES ($1, $2, $3)`,
      [newMemberId, groupId, role]
    );

    res.status(201).json({
      message: 'Member added successfully',
      member: {
        email,
        role
      }
    });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  } finally {
    client.release();
  }
}

/**
 * Remove member from group (owner only)
 */
async function removeMember(req, res) {
  const { groupId, memberId } = req.params;
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    // Check if user is owner
    const ownerResult = await client.query(
      `SELECT role FROM user_groups WHERE userId = $1 AND groupId = $2`,
      [userId, groupId]
    );

    if (ownerResult.rows.length === 0 || ownerResult.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only group owners can remove members' });
    }

    // Prevent owner from removing themselves
    if (parseInt(memberId) === userId) {
      return res.status(400).json({ error: 'Cannot remove yourself from group' });
    }

    // Remove member
    const result = await client.query(
      `DELETE FROM user_groups WHERE userId = $1 AND groupId = $2`,
      [memberId, groupId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Member not found in group' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  } finally {
    client.release();
  }
}

/**
 * Update member role (owner only)
 */
async function updateMemberRole(req, res) {
  const { groupId, memberId } = req.params;
  const { role } = req.body;
  const userId = req.user.userId;

  if (!['owner', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const client = await pool.connect();
  try {
    // Check if user is owner
    const ownerResult = await client.query(
      `SELECT role FROM user_groups WHERE userId = $1 AND groupId = $2`,
      [userId, groupId]
    );

    if (ownerResult.rows.length === 0 || ownerResult.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only group owners can update member roles' });
    }

    // Update role
    const result = await client.query(
      `UPDATE user_groups SET role = $1 WHERE userId = $2 AND groupId = $3`,
      [role, memberId, groupId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Member not found in group' });
    }

    res.json({ message: 'Member role updated successfully', role });
  } catch (err) {
    console.error('Update member role error:', err);
    res.status(500).json({ error: 'Failed to update member role' });
  } finally {
    client.release();
  }
}

module.exports = {
  createGroup,
  listGroups,
  getGroup,
  generateInviteCode,
  acceptInvite,
  addMember,
  removeMember,
  updateMemberRole
};
