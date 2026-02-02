// ensureTables.js
const { pool } = require('./postgresConnection'); // Update with path to your database connection setup

// ============================================================================
// USERS TABLE
// ============================================================================
const checkUsersTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename = 'users'
);
`;

const createUsersTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255),
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  authProvider VARCHAR(50) DEFAULT 'local' CHECK (authProvider IN ('local', 'auth0')),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const alterUsersTableQuery = `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordHash VARCHAR(255);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS authProvider VARCHAR(50) DEFAULT 'local';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
`;

// ============================================================================
// GROUPS TABLE
// ============================================================================
const checkGroupsTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename = 'groups'
);
`;

const createGroupsTableQuery = `
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ownerId INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const alterGroupsTableQuery = `
  ALTER TABLE groups ADD COLUMN IF NOT EXISTS ownerId INTEGER REFERENCES users (id) ON DELETE CASCADE;
  ALTER TABLE groups ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
`;

// ============================================================================
// USER_GROUPS JUNCTION TABLE
// ============================================================================
const checkUserGroupsTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename = 'user_groups'
);
`;

const createUserGroupsTableQuery = `
CREATE TABLE IF NOT EXISTS user_groups (
  userId INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  groupId INTEGER NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (userId, groupId)
);
`;

const alterUserGroupsTableQuery = `
  ALTER TABLE user_groups ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member';
`;

// ============================================================================
// CHILDREN TABLE
// ============================================================================
const checkChildrenTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename = 'children'
);
`;

const createChildrenTableQuery = `
CREATE TABLE IF NOT EXISTS children (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  groupId INTEGER NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const alterChildrenTableQuery = `
  ALTER TABLE children ADD COLUMN IF NOT EXISTS groupId INTEGER REFERENCES groups (id) ON DELETE CASCADE;
  ALTER TABLE children ADD COLUMN IF NOT EXISTS createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL;
  ALTER TABLE children ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE children ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
`;

// ============================================================================
// FOOD TABLE (updated with groupId)
// ============================================================================
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
  unit VARCHAR(50),
  dateprepared DATE,
  type VARCHAR(50),
  lastallocated DATE,
  notes TEXT,
  groupId INTEGER NOT NULL DEFAULT 1 REFERENCES groups (id) ON DELETE CASCADE,
  createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL,
  createddate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

const alterFoodTableQuery = `
  ALTER TABLE food ADD COLUMN IF NOT EXISTS groupId INTEGER REFERENCES groups (id) ON DELETE CASCADE;
  ALTER TABLE food ADD COLUMN IF NOT EXISTS createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL;
  ALTER TABLE food ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
  ALTER TABLE food ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE food ADD COLUMN IF NOT EXISTS createddate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
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
    status VARCHAR(10) CHECK (status IN ('active', 'inactive')),
    groupId INTEGER REFERENCES groups (id) ON DELETE CASCADE,
    userId INTEGER REFERENCES users (id) ON DELETE CASCADE,
    createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL,
    isGroupAlert BOOLEAN DEFAULT false
);
`;

const alterAlertsTableQuery = `
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS groupId INTEGER REFERENCES groups (id) ON DELETE CASCADE;
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS userId INTEGER REFERENCES users (id) ON DELETE CASCADE;
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL;
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS isGroupAlert BOOLEAN DEFAULT false;
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
    date DATE,
    type VARCHAR(50) CHECK (type IN ('Breakfast', 'Lunch', 'Dinner')),
    description TEXT,
    createddate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) CHECK (status IN ('active', 'inactive')),
    groupId INTEGER NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    childId INTEGER REFERENCES children (id) ON DELETE CASCADE,
    createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL
);
`;

const alterMenusTableQuery = `
  ALTER TABLE menus ADD COLUMN IF NOT EXISTS date DATE;
  ALTER TABLE menus ADD COLUMN IF NOT EXISTS type VARCHAR(50) CHECK (type IN ('Breakfast', 'Lunch', 'Dinner'));
  ALTER TABLE menus ADD COLUMN IF NOT EXISTS groupId INTEGER REFERENCES groups (id) ON DELETE CASCADE;
  ALTER TABLE menus ADD COLUMN IF NOT EXISTS childId INTEGER REFERENCES children (id) ON DELETE CASCADE;
  ALTER TABLE menus ADD COLUMN IF NOT EXISTS createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL;
  
  -- Make name nullable and add constraint fix
  ALTER TABLE menus ALTER COLUMN name DROP NOT NULL;
  
  -- Drop old constraint and add new one
  ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_date_type_key;
  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'menus_date_type_childid_unique'
    ) THEN
      ALTER TABLE menus ADD CONSTRAINT menus_date_type_childid_unique UNIQUE(date, type, childId, groupId);
    END IF;
  END $$;
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
    menu_id INTEGER NOT NULL REFERENCES menus (id) ON DELETE CASCADE,
    food_id INTEGER NOT NULL REFERENCES food (id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    allocated BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const alterMenuItemsTableQuery = `
  ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allocated BOOLEAN DEFAULT false;
  ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
  ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
`;

// ============================================================================
// GROUP_INVITES TABLE
// ============================================================================
const checkGroupInvitesTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename = 'group_invites'
);
`;

const createGroupInvitesTableQuery = `
CREATE TABLE IF NOT EXISTS group_invites (
  id SERIAL PRIMARY KEY,
  inviteCode VARCHAR(255) UNIQUE NOT NULL,
  groupId INTEGER NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  createdBy INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usedBy INTEGER REFERENCES users (id) ON DELETE SET NULL,
  usedAt TIMESTAMP WITH TIME ZONE
);
`;

// ============================================================================
// SCHEDULES TABLE
// ============================================================================
const checkSchedulesTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename = 'schedules'
);
`;

const createSchedulesTableQuery = `
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  childId INTEGER NOT NULL REFERENCES children (id) ON DELETE CASCADE,
  groupId INTEGER NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  isActive BOOLEAN DEFAULT false,
  createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const alterSchedulesTableQuery = `
  ALTER TABLE schedules ADD COLUMN IF NOT EXISTS name VARCHAR(255);
  ALTER TABLE schedules ADD COLUMN IF NOT EXISTS childId INTEGER REFERENCES children (id) ON DELETE CASCADE;
  ALTER TABLE schedules ADD COLUMN IF NOT EXISTS groupId INTEGER REFERENCES groups (id) ON DELETE CASCADE;
  ALTER TABLE schedules ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT false;
  ALTER TABLE schedules ADD COLUMN IF NOT EXISTS createdBy INTEGER REFERENCES users (id) ON DELETE SET NULL;
  ALTER TABLE schedules ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE schedules ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
`;

// ============================================================================
// SCHEDULE_ITEMS TABLE
// ============================================================================
const checkScheduleItemsTableExistsQuery = `
SELECT EXISTS (
  SELECT FROM 
    pg_catalog.pg_tables 
  WHERE 
    schemaname != 'pg_catalog' 
    AND schemaname != 'information_schema'
    AND tablename = 'schedule_items'
);
`;

const createScheduleItemsTableQuery = `
CREATE TABLE IF NOT EXISTS schedule_items (
  id SERIAL PRIMARY KEY,
  scheduleId INTEGER NOT NULL REFERENCES schedules (id) ON DELETE CASCADE,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  activityName VARCHAR(255) NOT NULL,
  description TEXT,
  notes TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT schedule_items_time_check CHECK (endTime > startTime)
);
`;

const alterScheduleItemsTableQuery = `
  ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS scheduleId INTEGER REFERENCES schedules (id) ON DELETE CASCADE;
  ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS startTime TIME;
  ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS endTime TIME;
  ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS activityName VARCHAR(255);
  ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS sortOrder INTEGER DEFAULT 0;
  ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
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
  await ensureTableExists(checkUsersTableExistsQuery, createUsersTableQuery, alterUsersTableQuery, 'Users');
  await ensureTableExists(checkGroupsTableExistsQuery, createGroupsTableQuery, alterGroupsTableQuery, 'Groups');
  await ensureTableExists(checkUserGroupsTableExistsQuery, createUserGroupsTableQuery, alterUserGroupsTableQuery, 'UserGroups');
  await ensureTableExists(checkChildrenTableExistsQuery, createChildrenTableQuery, alterChildrenTableQuery, 'Children');
  await ensureTableExists(checkFoodTableExistsQuery, createFoodTableQuery, alterFoodTableQuery, 'Food');
  await ensureTableExists(checkAlertsTableExistsQuery, createAlertsTableQuery, alterAlertsTableQuery, 'Alerts');
  await ensureTableExists(checkMenusTableExistsQuery, createMenusTableQuery, alterMenusTableQuery, 'Menus');
  await ensureTableExists(checkMenuItemsTableExistsQuery, createMenuItemsTableQuery, alterMenuItemsTableQuery, 'Menu_Items');
  await ensureTableExists(checkSchedulesTableExistsQuery, createSchedulesTableQuery, alterSchedulesTableQuery, 'Schedules');
  await ensureTableExists(checkScheduleItemsTableExistsQuery, createScheduleItemsTableQuery, alterScheduleItemsTableQuery, 'Schedule_Items');
}

module.exports = ensureAllTables;
