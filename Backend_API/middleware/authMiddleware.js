const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

/**
 * Validate local JWT token
 */
async function validateLocalJWT(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Validate Auth0 token (stub - implement Auth0 verification)
 * In production, use auth0-js or jose library to verify Auth0 tokens
 */
async function validateAuth0Token(token) {
  // TODO: Implement Auth0 token validation using Auth0 SDK
  // For now, return null to indicate not implemented
  console.warn('Auth0 validation not yet implemented');
  return null;
}

/**
 * Main auth middleware - pluggable strategy
 * Expects token in Authorization header: "Bearer <token>"
 * Attaches user context to req.user
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization header format' });
  }

  // Try local JWT first, then Auth0 if configured
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (!err) {
      // Local JWT valid
      req.user = decoded;
      return next();
    }

    // If local JWT fails and Auth0 is configured, try Auth0
    if (AUTH0_DOMAIN && AUTH0_AUDIENCE) {
      const auth0User = await validateAuth0Token(token);
      if (auth0User) {
        req.user = auth0User;
        return next();
      }
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
  });
}

/**
 * Optional: owner-only middleware - checks if user role is 'owner' in their group
 */
function requireOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden - owner role required' });
  }

  next();
}

/**
 * Rate limiting for login attempts (simple in-memory store)
 * In production, use Redis or similar
 */
const loginAttempts = new Map();

function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const email = req.body.email || '';
  const key = `${ip}:${email}`;

  if (!loginAttempts.has(key)) {
    loginAttempts.set(key, { attempts: 0, resetTime: Date.now() + 15 * 60 * 1000 });
  }

  const attempt = loginAttempts.get(key);

  // Reset after 15 minutes
  if (Date.now() > attempt.resetTime) {
    attempt.attempts = 0;
    attempt.resetTime = Date.now() + 15 * 60 * 1000;
  }

  if (attempt.attempts >= 5) {
    return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
  }

  attempt.attempts++;
  next();
}

/**
 * Clear login attempts on successful login
 */
function clearLoginAttempts(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const email = req.body.email || '';
  const key = `${ip}:${email}`;
  loginAttempts.delete(key);
  next();
}

module.exports = {
  authMiddleware,
  requireOwner,
  rateLimitLogin,
  clearLoginAttempts,
  JWT_SECRET
};
