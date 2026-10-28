/**
 * Authentication Routes
 * Implements input validation rules, rate limiting, and route definitions.
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Middleware to check validation results from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Rate limiter for login requests to protect against brute-force attacks
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 15, // Limit each IP to 15 login requests per 15 mins (generous for testing)
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for registration requests
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'test' ? 1000 : 30, // Limit each IP to 30 account creations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many accounts registered from this IP. Please try again later.',
  },
});

/**
 * Registration validation rules
 */
const registerValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required.')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters long.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }), // Normalize without losing dots in Gmail

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must include at least one uppercase letter, one lowercase letter, and one number.'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
];

/**
 * Login validation rules
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

// Mount endpoints
router.post(
  '/register',
  registerLimiter,
  registerValidation,
  handleValidationErrors,
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  loginValidation,
  handleValidationErrors,
  authController.login
);

router.get('/me', protect, authController.getMe);

router.post('/logout', authController.logout);

module.exports = router;
