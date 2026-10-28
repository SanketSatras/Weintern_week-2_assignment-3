/**
 * Authentication Middleware
 * Validates JWT from HttpOnly cookie (or Bearer token fallback), loads user,
 * and sets anti-caching headers for protected endpoints.
 */
const User = require('../models/User');
const { verifyToken, getCookieName } = require('../utils/tokenUtils');

const protect = async (req, res, next) => {
  // Ensure protected responses are never cached by browsers or intermediary proxies
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  let token = null;
  const cookieName = getCookieName();

  // 1. Primary mechanism: Extract JWT from HttpOnly cookie
  if (req.cookies && req.cookies[cookieName]) {
    token = req.cookies[cookieName];
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    // 2. Secondary fallback for automated testing / API clients
    token = req.headers.authorization.split(' ')[1];
  }

  // Handle missing token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to access this page.',
    });
  }

  try {
    // Verify token signature and expiration
    const decoded = verifyToken(token);

    // Ensure the user account still exists in the database
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists. Please register or log in again.',
      });
    }

    // Attach authenticated user profile to the request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again.',
    });
  }
};

module.exports = { protect };
