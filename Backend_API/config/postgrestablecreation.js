// ensureTables.js
const pool = require('./postgresConnection'); // Update with path to your database connection setup

// Check if the "food" table exists
const checkFoodTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename  = 'food'
);
`;

// Create the "food" table if it doesn't exist
const createFoodTableQuery = `
CREATE TABLE IF NOT EXISTS food (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  dateprepared DATE,
  type VARCHAR(50)
);
`;

// Check if the "alerts" table exists
const checkAlertsTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename  = 'alerts'
);
`;

// Create the "alerts" table if it doesn't exist
const createAlertsTableQuery = `
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    createddate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) CHECK (status IN ('active', 'inactive'))
);
`;

async function ensureTableExists(checkTableExistsQuery, createTableQuery, tableName) {
  const client = await pool.connect();
  try {
    const res = await client.query(checkTableExistsQuery);
    const tableExists = res.rows[0].exists;

    if (!tableExists) {
      await client.query(createTableQuery);
      console.log(`${tableName} table has been successfully created!`);
    } else {
      console.log(`${tableName} table already exists.`);
    }
  } catch (err) {
    console.error(`Error checking/creating ${tableName} table:`, err.stack);
  } finally {
    client.release();
  }
}

async function ensureAllTables() {
  await ensureTableExists(checkFoodTableExistsQuery, createFoodTableQuery, 'Food');
  await ensureTableExists(checkAlertsTableExistsQuery, createAlertsTableQuery, 'Alerts');
}

module.exports = ensureAllTables;
