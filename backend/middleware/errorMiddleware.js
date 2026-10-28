/**
 * Centralized Error Handling Middleware
 * Safely transforms operational and database errors into client-friendly responses
 * without leaking sensitive stack traces, DB connection strings, or internal details.
 */

// 404 Route Not Found Handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

// Central Error Handler
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Something went wrong. Please try again.';

  // 1. Handle Malformed JSON payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body. Please verify request syntax.';
  }

  // 2. Handle Payload Too Large (e.g., body exceeding limit)
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload too large. Maximum allowed size is 10KB.';
  }

  // 3. Handle MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    if (err.keyPattern && err.keyPattern.email) {
      message = 'An account with this email already exists.';
    } else if (err.keyPattern && err.keyPattern.username) {
      message = 'This username is already taken. Please choose another.';
    } else {
      message = 'A record with this identifier already exists.';
    }
  }

  // 4. Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((val) => val.message);
    message = errors.join('. ');
  }

  // 5. Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for parameter: ${err.path}`;
  }

  // 6. Handle JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Safe Logging (do not log sensitive user data)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error Handler] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${message}`);
  }

  // Send sanitized response to client
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode === 500
      ? { devErrorDetails: err.message }
      : {}),
  });
};

module.exports = { notFoundHandler, errorHandler };
