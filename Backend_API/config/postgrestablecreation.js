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

ALTER TABLE food
ADD COLUMN lastallocated DATE;

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

// Create the "menus" table (drop and recreate to enforce schema)
const createMenusTableQuery = `
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS menus;

CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Breakfast','Lunch','Dinner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, type)
);
CREATE INDEX IF NOT EXISTS idx_menus_date_type ON menus(date, type);
`;

const alterMenusTableQuery = `

`;

// Create the "menu_items" table (drop and recreate to enforce schema)
const createMenuItemsTableQuery = `
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  item_id INTEGER,
  name TEXT,
  quantity INTEGER NOT NULL,
  allocated BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(active);
CREATE INDEX IF NOT EXISTS idx_menu_items_item_id ON menu_items(item_id);
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
  await ensureTableExists(checkFoodTableExistsQuery, createFoodTableQuery,alterFoodTableQuery, 'Food');
  await ensureTableExists(checkAlertsTableExistsQuery, createAlertsTableQuery,alterAlertsTableQuery, 'Alerts');
  await ensureTableExists(checkMenusTableExistsQuery, createMenusTableQuery,alterMenusTableQuery, 'Menus');
  await ensureTableExists(checkMenuItemsTableExistsQuery, createMenuItemsTableQuery,alterMenuItemsTableQuery, 'Menu_Items');
}

module.exports = ensureAllTables;
