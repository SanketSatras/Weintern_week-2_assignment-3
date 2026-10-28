/**
 * Main Application Server
 * Configures middleware, security headers, static asset serving, routes, and database connection.
 */
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Load environment variables before importing modules that rely on them
dotenv.config();

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { getHealth } = require('./controllers/authController');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// 1. Security Headers with Helmet
// Configured to permit vanilla scripts, external Google fonts, and inline styles safely
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Server Port
const PORT = process.env.PORT || 5001;

// 2. CORS configuration with explicit credentials support
const allowedOrigin = process.env.CLIENT_URL || `http://localhost:${PORT}`;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin static files)
      if (
        !origin ||
        origin === allowedOrigin ||
        origin === `http://localhost:${PORT}` ||
        origin === `http://127.0.0.1:${PORT}`
      ) {
        return callback(null, true);
      }
      return callback(new Error('Cross-Origin Request Blocked by CORS policy'));
    },
    credentials: true, // Crucial for sending/receiving HttpOnly cookies
  })
);

// 3. Request Body Parsers (with size limits to prevent Denial of Service)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Cookie Parser
app.use(cookieParser());

// 5. Serve Frontend Static Assets (Shared Origin Deployment)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// 6. Public Health Check Endpoint
app.get('/api/health', getHealth);

// 7. API Routes
app.use('/api/auth', authRoutes);

// 8. Root Redirect (Points browser directly to login page)
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// 9. Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if not running in Jest test runner
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await connectDB();
      const server = app.listen(PORT, () => {
        console.log(`[Server] Authentication System running on http://localhost:${PORT}`);
        console.log(`[Frontend] Accessible at http://localhost:${PORT}/login.html`);
      });

      // Graceful shutdown handling
      const handleShutdown = (signal) => {
        console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
        server.close(async () => {
          const { disconnectDB } = require('./config/db');
          await disconnectDB();
          console.log('[Server] Process terminated.');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => handleShutdown('SIGTERM'));
      process.on('SIGINT', () => handleShutdown('SIGINT'));
    } catch (err) {
      console.error(`[Server Error] Startup failed: ${err.message}`);
      process.exit(1);
    }
  })();
}

module.exports = app;
