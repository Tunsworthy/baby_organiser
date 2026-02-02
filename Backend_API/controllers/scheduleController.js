const { pool } = require('../config/postgresConnection');

async function ensureUserInGroup(userId, groupId) {
  const result = await pool.query(
    'SELECT 1 FROM user_groups WHERE userId = $1 AND groupId = $2',
    [userId, groupId]
  );
  return result.rows.length > 0;
}

async function getChildGroup(childId) {
  const result = await pool.query(
    'SELECT id, groupId FROM children WHERE id = $1',
    [childId]
  );
  return result.rows[0];
}

async function getScheduleById(scheduleId) {
  const result = await pool.query(
    `SELECT id, name, childId, groupId, isActive, createdBy, createdAt, updatedAt
     FROM schedules
     WHERE id = $1`,
    [scheduleId]
  );
  return result.rows[0];
}

async function listSchedules(req, res) {
  const userId = req.user.userId;
  const { childId } = req.query;

  if (!childId) {
    return res.status(400).json({ error: 'childId is required' });
  }

  try {
    const child = await getChildGroup(childId);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const isMember = await ensureUserInGroup(userId, child.groupid);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT id, name, childId, groupId, isActive, createdBy, createdAt, updatedAt
       FROM schedules
       WHERE childId = $1
       ORDER BY createdAt DESC`,
      [childId]
    );

    res.json({
      schedules: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        childId: row.childid,
        groupId: row.groupid,
        isActive: row.isactive,
        createdBy: row.createdby,
        createdAt: row.createdat,
        updatedAt: row.updatedat
      }))
    });
  } catch (err) {
    console.error('List schedules error:', err);
    res.status(500).json({ error: 'Failed to list schedules' });
  }
}

async function getSchedule(req, res) {
  const userId = req.user.userId;
  const { scheduleId } = req.params;

  try {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const isMember = await ensureUserInGroup(userId, schedule.groupid);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const itemsResult = await pool.query(
      `SELECT id, scheduleId, startTime, endTime, activityName, description, notes, sortOrder, createdAt, updatedAt
       FROM schedule_items
       WHERE scheduleId = $1
       ORDER BY startTime ASC`,
      [scheduleId]
    );

    res.json({
      schedule: {
        id: schedule.id,
        name: schedule.name,
        childId: schedule.childid,
        groupId: schedule.groupid,
        isActive: schedule.isactive,
        createdBy: schedule.createdby,
        createdAt: schedule.createdat,
        updatedAt: schedule.updatedat
      },
      items: itemsResult.rows.map((row) => ({
        id: row.id,
        scheduleId: row.scheduleid,
        startTime: row.starttime,
        endTime: row.endtime,
        activityName: row.activityname,
        description: row.description,
        notes: row.notes,
        sortOrder: row.sortorder,
        createdAt: row.createdat,
        updatedAt: row.updatedat
      }))
    });
  } catch (err) {
    console.error('Get schedule error:', err);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
}

async function createSchedule(req, res) {
  const userId = req.user.userId;
  const { childId, name, isActive = false } = req.body;

  if (!childId || !name) {
    return res.status(400).json({ error: 'childId and name are required' });
  }

  const client = await pool.connect();
  try {
    const child = await getChildGroup(childId);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const isMember = await ensureUserInGroup(userId, child.groupid);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await client.query('BEGIN');

    if (isActive) {
      await client.query(
        'UPDATE schedules SET isActive = false WHERE childId = $1',
        [childId]
      );
    }

    const result = await client.query(
      `INSERT INTO schedules (name, childId, groupId, isActive, createdBy)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, childId, groupId, isActive, createdBy, createdAt, updatedAt`,
      [name, childId, child.groupid, isActive, userId]
    );

    await client.query('COMMIT');

    const schedule = result.rows[0];
    res.status(201).json({
      schedule: {
        id: schedule.id,
        name: schedule.name,
        childId: schedule.childid,
        groupId: schedule.groupid,
        isActive: schedule.isactive,
        createdBy: schedule.createdby,
        createdAt: schedule.createdat,
        updatedAt: schedule.updatedat
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create schedule error:', err);
    res.status(500).json({ error: 'Failed to create schedule' });
  } finally {
    client.release();
  }
}

async function updateSchedule(req, res) {
  const userId = req.user.userId;
  const { scheduleId } = req.params;
  const { name, isActive } = req.body;

  const client = await pool.connect();
  try {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const isMember = await ensureUserInGroup(userId, schedule.groupid);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await client.query('BEGIN');

    if (isActive === true) {
      await client.query(
        'UPDATE schedules SET isActive = false WHERE childId = $1',
        [schedule.childid]
      );
    }

    const result = await client.query(
      `UPDATE schedules
       SET name = COALESCE($1, name),
           isActive = COALESCE($2, isActive),
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, childId, groupId, isActive, createdBy, createdAt, updatedAt`,
      [name, isActive, scheduleId]
    );

    await client.query('COMMIT');

    const updated = result.rows[0];
    res.json({
      schedule: {
        id: updated.id,
        name: updated.name,
        childId: updated.childid,
        groupId: updated.groupid,
        isActive: updated.isactive,
        createdBy: updated.createdby,
        createdAt: updated.createdat,
        updatedAt: updated.updatedat
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update schedule error:', err);
    res.status(500).json({ error: 'Failed to update schedule' });
  } finally {
    client.release();
  }
}

async function activateSchedule(req, res) {
  const userId = req.user.userId;
  const { scheduleId } = req.params;

  const client = await pool.connect();
  try {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const isMember = await ensureUserInGroup(userId, schedule.groupid);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await client.query('BEGIN');
    await client.query('UPDATE schedules SET isActive = false WHERE childId = $1', [schedule.childid]);
    await client.query('UPDATE schedules SET isActive = true WHERE id = $1', [scheduleId]);
    await client.query('COMMIT');

    res.json({ message: 'Schedule activated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Activate schedule error:', err);
    res.status(500).json({ error: 'Failed to activate schedule' });
  } finally {
    client.release();
  }
}

async function deleteSchedule(req, res) {
  const userId = req.user.userId;
  const { scheduleId } = req.params;

  try {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const isMember = await ensureUserInGroup(userId, schedule.groupid);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM schedules WHERE id = $1', [scheduleId]);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    console.error('Delete schedule error:', err);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
}

async function copySchedule(req, res) {
  const userId = req.user.userId;
  const { scheduleId } = req.params;
  const { targetChildId, name } = req.body;

  if (!targetChildId) {
    return res.status(400).json({ error: 'targetChildId is required' });
  }

  const client = await pool.connect();
  try {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const sourceMember = await ensureUserInGroup(userId, schedule.groupid);
    if (!sourceMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const targetChild = await getChildGroup(targetChildId);
    if (!targetChild) {
      return res.status(404).json({ error: 'Target child not found' });
    }

    const targetMember = await ensureUserInGroup(userId, targetChild.groupid);
    if (!targetMember) {
      return res.status(403).json({ error: 'Access denied to target group' });
    }

    await client.query('BEGIN');

    const newName = name || `${schedule.name} (Copy)`;
    const scheduleResult = await client.query(
      `INSERT INTO schedules (name, childId, groupId, isActive, createdBy)
       VALUES ($1, $2, $3, false, $4)
       RETURNING id, name, childId, groupId, isActive, createdBy, createdAt, updatedAt`,
      [newName, targetChildId, targetChild.groupid, userId]
    );

    const itemsResult = await client.query(
      `SELECT startTime, endTime, activityName, description, notes, sortOrder
       FROM schedule_items
       WHERE scheduleId = $1
       ORDER BY startTime ASC`,
      [scheduleId]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        `INSERT INTO schedule_items (scheduleId, startTime, endTime, activityName, description, notes, sortOrder)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [scheduleResult.rows[0].id, item.starttime, item.endtime, item.activityname, item.description, item.notes, item.sortorder]
      );
    }

    await client.query('COMMIT');

    const newSchedule = scheduleResult.rows[0];
    res.status(201).json({
      schedule: {
        id: newSchedule.id,
        name: newSchedule.name,
        childId: newSchedule.childid,
        groupId: newSchedule.groupid,
        isActive: newSchedule.isactive,
        createdBy: newSchedule.createdby,
        createdAt: newSchedule.createdat,
        updatedAt: newSchedule.updatedat
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Copy schedule error:', err);
    res.status(500).json({ error: 'Failed to copy schedule' });
  } finally {
    client.release();
  }
}

async function createScheduleItem(req, res) {
  const userId = req.user.userId;
  const { scheduleId } = req.params;
  const { startTime, endTime, activityName, description, notes, sortOrder = 0 } = req.body;

  if (!startTime || !endTime || !activityName) {
    return res.status(400).json({ error: 'startTime, endTime, and activityName are required' });
  }

  try {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const isMember = await ensureUserInGroup(userId, schedule.groupid);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `INSERT INTO schedule_items (scheduleId, startTime, endTime, activityName, description, notes, sortOrder)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, scheduleId, startTime, endTime, activityName, description, notes, sortOrder, createdAt, updatedAt`,
      [scheduleId, startTime, endTime, activityName, description || '', notes || '', sortOrder]
    );

    const item = result.rows[0];
    res.status(201).json({
      item: {
        id: item.id,
        scheduleId: item.scheduleid,
        startTime: item.starttime,
        endTime: item.endtime,
        activityName: item.activityname,
        description: item.description,
        notes: item.notes,
        sortOrder: item.sortorder,
        createdAt: item.createdat,
        updatedAt: item.updatedat
      }
    });
  } catch (err) {
    console.error('Create schedule item error:', err);
    res.status(500).json({ error: 'Failed to create schedule item' });
  }
}

async function updateScheduleItem(req, res) {
  const userId = req.user.userId;
  const { itemId } = req.params;
  const { startTime, endTime, activityName, description, notes, sortOrder } = req.body;

  try {
    const existing = await pool.query(
      `SELECT si.id, si.scheduleId, s.groupId
       FROM schedule_items si
       JOIN schedules s ON s.id = si.scheduleId
       WHERE si.id = $1`,
      [itemId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule item not found' });
    }

    const scheduleGroupId = existing.rows[0].groupid;
    const isMember = await ensureUserInGroup(userId, scheduleGroupId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `UPDATE schedule_items
       SET startTime = COALESCE($1, startTime),
           endTime = COALESCE($2, endTime),
           activityName = COALESCE($3, activityName),
           description = COALESCE($4, description),
           notes = COALESCE($5, notes),
           sortOrder = COALESCE($6, sortOrder),
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, scheduleId, startTime, endTime, activityName, description, notes, sortOrder, createdAt, updatedAt`,
      [startTime, endTime, activityName, description, notes, sortOrder, itemId]
    );

    const item = result.rows[0];
    res.json({
      item: {
        id: item.id,
        scheduleId: item.scheduleid,
        startTime: item.starttime,
        endTime: item.endtime,
        activityName: item.activityname,
        description: item.description,
        notes: item.notes,
        sortOrder: item.sortorder,
        createdAt: item.createdat,
        updatedAt: item.updatedat
      }
    });
  } catch (err) {
    console.error('Update schedule item error:', err);
    res.status(500).json({ error: 'Failed to update schedule item' });
  }
}

async function deleteScheduleItem(req, res) {
  const userId = req.user.userId;
  const { itemId } = req.params;

  try {
    const existing = await pool.query(
      `SELECT si.id, s.groupId
       FROM schedule_items si
       JOIN schedules s ON s.id = si.scheduleId
       WHERE si.id = $1`,
      [itemId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule item not found' });
    }

    const scheduleGroupId = existing.rows[0].groupid;
    const isMember = await ensureUserInGroup(userId, scheduleGroupId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM schedule_items WHERE id = $1', [itemId]);
    res.json({ message: 'Schedule item deleted' });
  } catch (err) {
    console.error('Delete schedule item error:', err);
    res.status(500).json({ error: 'Failed to delete schedule item' });
  }
}

module.exports = {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  activateSchedule,
  deleteSchedule,
  copySchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem
};
