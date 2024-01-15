// ensureFoodTable.js
const pool = require('./postgresConnection'); // Update with path to your database connection setup

const checkTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename  = 'food'
);
`;

//name, quantity, dateprepared, type

const createTableQuery = `
CREATE TABLE IF NOT EXISTS food (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  dateprepared DATE,
  type VARCHAR(50)
);
`;

async function ensureFoodTableExists() {
  const client = await pool.connect();
  try {
    const res = await client.query(checkTableExistsQuery);
    const tableExists = res.rows[0].exists;

    if (!tableExists) {
      await client.query(createTableQuery);
      console.log('Food table has been successfully created!');
    } else {
      console.log('Food table already exists.');
    }
  } catch (err) {
    console.error('Error checking/creating food table:', err.stack);
  } finally {
    client.release();
  }
}

module.exports = ensureFoodTableExists;
