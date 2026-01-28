const he = require('he');
const { pool } = require('../config/postgresConnection');

// Get all alerts for user and group
exports.getAllAlerts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const groupId = req.user.groupId;

        const result = await pool.query(
            `SELECT id, name, type, message, createddate, status, groupId, userId, createdBy, isGroupAlert
             FROM alerts
             WHERE (userId = $1 OR (groupId = $2 AND isGroupAlert = true))
             ORDER BY createddate DESC`,
            [userId, groupId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: he.encode(error.message) });
    }
};

// Get an alert by ID
exports.getAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const groupId = req.user.groupId;

        const result = await pool.query(
            `SELECT id, name, type, message, createddate, status, groupId, userId, createdBy, isGroupAlert
             FROM alerts
             WHERE id = $1 AND (userId = $2 OR (groupId = $3 AND isGroupAlert = true))`,
            [id, userId, groupId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: he.encode(error.message) });
    }
};

// Get all active alerts for user and group
exports.getActiveAlerts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const groupId = req.user.groupId;

        const result = await pool.query(
            `SELECT id, name, type, message, createddate, status, groupId, userId, createdBy, isGroupAlert
             FROM alerts
             WHERE status = 'active' AND (userId = $1 OR (groupId = $2 AND isGroupAlert = true))
             ORDER BY createddate DESC`,
            [userId, groupId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: he.encode(error.message) });
    }
};

// Create a new alert
exports.createAlert = async (req, res) => {
    try {
        const { name, type, message, status = 'active', targetUserId, isGroupAlert = false } = req.body;
        const createdBy = req.user.userId;
        const groupId = req.user.groupId;
        
        // If targeting specific user, verify they're in the group
        let alertUserId = null;
        if (targetUserId) {
            const userCheck = await pool.query(
                'SELECT userId FROM user_groups WHERE userId = $1 AND groupId = $2',
                [targetUserId, groupId]
            );
            if (userCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Target user not found in group' });
            }
            alertUserId = targetUserId;
        }

        const result = await pool.query(
            `INSERT INTO alerts (name, type, message, status, groupId, userId, createdBy, isGroupAlert)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, name, type, message, createddate, status, groupId, userId, createdBy, isGroupAlert`,
            [name, type, message, status, groupId, alertUserId, createdBy, isGroupAlert]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: he.encode(error.message) });
    }
};

// Update an alert by ID (dismiss/change status)
exports.updateAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;
        const groupId = req.user.groupId;

        // Verify user has access to this alert
        const alertCheck = await pool.query(
            `SELECT id FROM alerts WHERE id = $1 AND (userId = $2 OR (groupId = $3 AND isGroupAlert = true))`,
            [id, userId, groupId]
        );

        if (alertCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Alert not found or access denied' });
        }

        const result = await pool.query(
            `UPDATE alerts SET status = $1 WHERE id = $2
             RETURNING id, name, type, message, createddate, status, groupId, userId, createdBy, isGroupAlert`,
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Alert not found or no changes made' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: he.encode(error.message) });
    }
};
