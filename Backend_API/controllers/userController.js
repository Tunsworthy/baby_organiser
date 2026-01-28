const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/postgresConnection');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Register a new user and create a default group for them
 */
async function register(req, res) {
  const { email, password, firstName, lastName, authProvider = 'local' } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (authProvider === 'local' && password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = authProvider === 'local' 
      ? await bcrypt.hash(password, 10)
      : null;

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, passwordHash, firstName, lastName, authProvider)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, firstName, lastName, authProvider`,
      [email, passwordHash, firstName || '', lastName || '', authProvider]
    );

    const user = userResult.rows[0];

    // Create default group for the user
    const groupName = `${firstName || email}'s Family`;
    const groupResult = await client.query(
      `INSERT INTO groups (name, ownerId)
       VALUES ($1, $2)
       RETURNING id, name`,
      [groupName, user.id]
    );

    const group = groupResult.rows[0];

    // Add user to group as owner
    await client.query(
      `INSERT INTO user_groups (userId, groupId, role)
       VALUES ($1, $2, $3)`,
      [user.id, group.id, 'owner']
    );

    await client.query('COMMIT');

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, groupId: group.id, role: 'owner', authProvider: user.authProvider },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, groupId: group.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: user.authProvider
      },
      group: {
        id: group.id,
        name: group.name
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
}

/**
 * Login user with email and password
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.firstName, u.lastName, u.passwordHash, u.authProvider,
              ug.groupId, ug.role
       FROM users u
       LEFT JOIN user_groups ug ON u.id = ug.userId
       WHERE u.email = $1
       LIMIT 1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        groupId: user.groupid, // groupId from user_groups
        role: user.role,
        authProvider: user.authprovider
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, groupId: user.groupid },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        authProvider: user.authprovider
      },
      groupId: user.groupid,
      role: user.role,
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Get updated user info
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.authProvider,
              ug.groupId, ug.role
       FROM users u
       LEFT JOIN user_groups ug ON u.id = ug.userId
       WHERE u.id = $1
       LIMIT 1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        groupId: user.groupid,
        role: user.role,
        authProvider: user.authprovider
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

/**
 * Get current user profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.userId;

    const userResult = await pool.query(
      `SELECT u.id, u.email, u.firstName, u.lastName, u.authProvider, u.createdAt,
              json_agg(json_build_object('id', g.id, 'name', g.name, 'role', ug.role)) as groups
       FROM users u
       LEFT JOIN user_groups ug ON u.id = ug.userId
       LEFT JOIN groups g ON ug.groupId = g.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstname,
      lastName: user.lastname,
      authProvider: user.authprovider,
      createdAt: user.createdat,
      groups: user.groups || []
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  getProfile
};
