const { pool } = require('../config/postgresConnection');

/**
 * Create a child in the group
 */
async function createChild(req, res) {
  const { name } = req.body;
  const groupId = req.user.groupId;
  const userId = req.user.userId;

  if (!name) {
    return res.status(400).json({ error: 'Child name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO children (name, groupId, createdBy)
       VALUES ($1, $2, $3)
       RETURNING id, name, groupId, createdBy, createdAt`,
      [name, groupId, userId]
    );

    const child = result.rows[0];
    res.status(201).json({
      message: 'Child created successfully',
      child: {
        id: child.id,
        name: child.name,
        groupId: child.groupid,
        createdBy: child.createdby,
        createdAt: child.createdat
      }
    });
  } catch (err) {
    console.error('Create child error:', err);
    res.status(500).json({ error: 'Failed to create child' });
  }
}

/**
 * List all children in the group
 */
async function listChildren(req, res) {
  const userId = req.user.userId;
  const requestedGroupId = req.query.groupId || req.user.groupId;

  try {
    if (req.query.groupId) {
      const memberResult = await pool.query(
        'SELECT 1 FROM user_groups WHERE userId = $1 AND groupId = $2',
        [userId, requestedGroupId]
      );
      if (memberResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await pool.query(
      `SELECT id, name, groupId, createdBy, createdAt, updatedAt
       FROM children
       WHERE groupId = $1
       ORDER BY createdAt DESC`,
      [requestedGroupId]
    );

    res.json({
      children: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        groupId: row.groupid,
        createdBy: row.createdby,
        createdAt: row.createdat,
        updatedAt: row.updatedat
      }))
    });
  } catch (err) {
    console.error('List children error:', err);
    res.status(500).json({ error: 'Failed to list children' });
  }
}

/**
 * Get a specific child
 */
async function getChild(req, res) {
  const { childId } = req.params;
  const groupId = req.user.groupId;

  try {
    const result = await pool.query(
      `SELECT id, name, groupId, createdBy, createdAt, updatedAt
       FROM children
       WHERE id = $1 AND groupId = $2`,
      [childId, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const child = result.rows[0];
    res.json({
      child: {
        id: child.id,
        name: child.name,
        groupId: child.groupid,
        createdBy: child.createdby,
        createdAt: child.createdat,
        updatedAt: child.updatedat
      }
    });
  } catch (err) {
    console.error('Get child error:', err);
    res.status(500).json({ error: 'Failed to get child' });
  }
}

/**
 * Update a child
 */
async function updateChild(req, res) {
  const { childId } = req.params;
  const { name } = req.body;
  const groupId = req.user.groupId;

  if (!name) {
    return res.status(400).json({ error: 'Child name is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE children
       SET name = $1, updatedAt = CURRENT_TIMESTAMP
       WHERE id = $2 AND groupId = $3
       RETURNING id, name, groupId, createdBy, createdAt, updatedAt`,
      [name, childId, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const child = result.rows[0];
    res.json({
      message: 'Child updated successfully',
      child: {
        id: child.id,
        name: child.name,
        groupId: child.groupid,
        createdBy: child.createdby,
        createdAt: child.createdat,
        updatedAt: child.updatedat
      }
    });
  } catch (err) {
    console.error('Update child error:', err);
    res.status(500).json({ error: 'Failed to update child' });
  }
}

/**
 * Delete a child
 */
async function deleteChild(req, res) {
  const { childId } = req.params;
  const groupId = req.user.groupId;

  try {
    const result = await pool.query(
      `DELETE FROM children
       WHERE id = $1 AND groupId = $2`,
      [childId, groupId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ message: 'Child deleted successfully' });
  } catch (err) {
    console.error('Delete child error:', err);
    res.status(500).json({ error: 'Failed to delete child' });
  }
}

module.exports = {
  createChild,
  listChildren,
  getChild,
  updateChild,
  deleteChild
};
