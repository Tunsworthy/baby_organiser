const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

const feedsync = new Pool({
  connectionString: process.env.POSTGRES_FEEDSNYC
});

feedsync.on('connect', () => {
  console.log('Connected to feedsync');
});

module.exports = {pool,feedsync};
// config/server.js