/**
 * Token Utilities
 * Handles JWT signing, verification, and HttpOnly cookie management.
 */
const jwt = require('jsonwebtoken');

const getCookieName = () => process.env.COOKIE_NAME || 'auth_token';

/**
 * Returns consistent cookie configuration options.
 * In production:
 *   - secure: true (requires HTTPS)
 *   - sameSite: 'strict' (prevents CSRF in standard navigation)
 * In development:
 *   - secure: false (allows HTTP localhost)
 *   - sameSite: 'lax' (facilitates smooth local development while still guarding against cross-site POSTs)
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Prevents client-side JavaScript access (mitigates XSS)
    secure: isProduction, // Enforces HTTPS transmission in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF mitigation
    maxAge: 15 * 60 * 1000, // 15 minutes (in milliseconds)
    path: '/',
  };
};

/**
 * Signs a JWT with user payload and configured expiration.
 */
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from environment configuration.');
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

/**
 * Sets the signed JWT into an HttpOnly cookie on the response.
 */
const setTokenCookie = (res, token) => {
  res.cookie(getCookieName(), token, getCookieOptions());
};

/**
 * Clears the authentication cookie using exact matching attributes.
 */
const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(getCookieName(), {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

/**
 * Synchronously or asynchronously verifies a JWT signature.
 */
const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from environment configuration.');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  getCookieName,
  getCookieOptions,
  generateToken,
  setTokenCookie,
  clearTokenCookie,
  verifyToken,
};
