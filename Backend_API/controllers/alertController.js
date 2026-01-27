const he = require('he');
const { pool } = require('../config/postgresConnection');

// Get all alerts
exports.getAllAlerts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM alerts');
        res.json(result.rows);
    } catch (error) {
        res.status(500).send(he.encode(error.message));
    }
};

// Get an alert by ID
exports.getAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('Alert not found');
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).send(he.encode(error.message));
    }
};

// Get all active alerts
exports.getActiveAlerts = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM alerts WHERE status = 'active'");
        res.json(result.rows);
    } catch (error) {
        res.status(500).send(he.encode(error.message));
    }
};

// Create a new alert
exports.createAlert = async (req, res) => {
    try {
        const { name, type, message, status } = req.body;
        const result = await pool.query(
            'INSERT INTO alerts (name, type, message, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, type, message, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).send(he.encode(error.message));
    }
};

// Update an alert by ID
exports.updateAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const {status } = req.body;
        const result = await pool.query(
            'UPDATE alerts SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Alert not found or no changes made.');
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).send(he.encode(error.message));
    }
};
