// /controllers/alertController.js

const he = require('he');
const db = require('../config/postgresConnection'); // Update with path to your database connection setup

// Get all alerts
exports.getAllAlerts = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM alerts');
        res.json(result.rows);
    } catch (error) {

        const he = require('he');
        res.status(500).send(he.encode(error.message));

    }
};

// Get an alert by ID
exports.getAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM alerts WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('Alert not found');
        }

        res.json(result.rows[0]);
    } catch (error) {

        const he = require('he');
        res.status(500).send(he.encode(error.message));
    }
};

// Get all active alerts
exports.getActiveAlerts = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM alerts WHERE status = 'active'");
        res.json(result.rows);
    } catch (error) {

        const he = require('he');
        res.status(500).send(he.encode(error.message));

    }
};

// Create a new alert
exports.createAlert = async (req, res) => {
    try {
        const { name, type, message, status } = req.body;
        const result = await db.query(
            'INSERT INTO alerts (name, type, message, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, type, message, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {

        const he = require('he');
        res.status(500).send(he.encode(error.message));

    }
};

// Update an alert by ID
exports.updateAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const {status } = req.body;
        const result = await db.query(
            'UPDATE alerts SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Alert not found or no changes made.');
        }

        res.json(result.rows[0]);
    } catch (error) {
        const he = require('he');
        res.status(500).send(he.encode(error.message));

    }
};
