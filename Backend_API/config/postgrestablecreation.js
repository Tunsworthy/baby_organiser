// ensureTables.js
const { pool } = require('./postgresConnection'); // Update with path to your database connection setup

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
  type VARCHAR(50),
  lastallocated DATE
);

`;

const alterFoodTableQuery = `

`; // no-op: column already created in CREATE TABLE

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

const alterAlertsTableQuery = `

`;

// Check if the "menus" table exists
const checkMenusTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename  = 'menus'
);
`;

// Create the "menus" table if it doesn't exist
const createMenusTableQuery = `
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    createddate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) CHECK (status IN ('active', 'inactive'))
);
`;

const alterMenusTableQuery = `

`;

// Check if the "menu_items" table exists
const checkMenuItemsTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename = 'menu_items'
);
`;

// Create the "menu_items" table if it doesn't exist
const createMenuItemsTableQuery = `
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    menu_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (menu_id) REFERENCES menus (id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food (id) ON DELETE CASCADE
);
`;

const alterMenuItemsTableQuery = `

`;

async function ensureTableExists(checkTableExistsQuery, createTableQuery,alterTableQuery, tableName) {
  const client = await pool.connect();
  try {
    const res = await client.query(checkTableExistsQuery);
    const tableExists = res.rows[0].exists;

    if (!tableExists) {
      await client.query(createTableQuery);
      console.log(`${tableName} table has been successfully created!`);
    } else {
      console.log(`${tableName} table already exists.`);
      await client.query(alterTableQuery)
    }
  } catch (err) {
    console.error(`Error checking/creating ${tableName} table:`, err.stack);
  } finally {
    client.release();
  }
}

async function ensureAllTables() {
  await ensureTableExists(checkFoodTableExistsQuery, createFoodTableQuery, alterFoodTableQuery, 'Food');
  await ensureTableExists(checkAlertsTableExistsQuery, createAlertsTableQuery, alterAlertsTableQuery, 'Alerts');
  await ensureTableExists(checkMenusTableExistsQuery, createMenusTableQuery, alterMenusTableQuery, 'Menus');
  await ensureTableExists(checkMenuItemsTableExistsQuery, createMenuItemsTableQuery, alterMenuItemsTableQuery, 'Menu_Items');
}

module.exports = ensureAllTables;
