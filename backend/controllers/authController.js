/**
 * Authentication Controller
 * Handles user registration, login, profile inspection, logout, and health check.
 */
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/tokenUtils');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account with hashed password
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Normalize email consistently
    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanUsername = (username || '').trim();

    // Check if an account already exists with this email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password with bcryptjs work factor
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in MongoDB with passwordHash field
    const user = await User.create({
      username: cleanUsername,
      email: normalizedEmail,
      passwordHash,
    });

    // Return 201 Created without sensitive fields
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please log in.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials and issue signed HttpOnly JWT cookie
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Normalize email
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Lookup user in MongoDB
    const user = await User.findOne({ email: normalizedEmail });

    // Generic error response to avoid credential enumeration
    const invalidCredentialsResponse = () =>
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });

    if (!user) {
      return invalidCredentialsResponse();
    }

    // Compare submitted password against stored bcrypt hash
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return invalidCredentialsResponse();
    }

    // Generate signed JWT token
    const token = generateToken(user._id);

    // Issue HttpOnly cookie
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Login successful. Welcome back!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve profile data for currently authenticated user
 * @access  Protected (Requires valid JWT)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Clear authentication cookie and invalidate client session
 * @access  Public (Can be called anytime)
 */
const logout = async (req, res, next) => {
  try {
    // Clear the HttpOnly authentication cookie
    clearTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/health
 * @desc    Health check endpoint to verify server status
 * @access  Public
 */
const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  getHealth,
};
