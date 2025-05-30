//const db = require('../config/postgresConnection'); // Update with path to your database connection setup
const { feedsync  } = require('../config/postgresConnection'); // Update with path to your database connection setup
const escapeHtml = require('escape-html');

exports.latest = async (req, res) => {
    try {
        // Assuming 'db' is your database instance and it has a method 'query'
        const sql = 'SELECT * FROM nappy_log WHERE timestamp = (SELECT MAX(timestamp) FROM nappy_log)';
        const items = await feedsync.query(sql); // Execute the query and get the results

        res.status(200).json(items);
    } catch (error) {
        console.error(error); // It's a good practice to log the actual error
        res.status(500).json({ message: 'Error fetching items from the nappylog table' });
    }
};






