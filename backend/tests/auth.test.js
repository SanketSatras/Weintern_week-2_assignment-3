/**
 * Automated Test Suite for Authentication API
 * Tests health, registration, login, JWT cookies, route protection, logout, and error handling.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const { connectDB, disconnectDB } = require('../config/db');

const TEST_DB_URI =
  process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/authentication_system_test';

describe('Authentication API Test Suite', () => {
  beforeAll(async () => {
    // Ensure test environment variables are set
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890abcdef';
    process.env.COOKIE_NAME = 'auth_token';

    // Connect to dedicated test database
    await connectDB(TEST_DB_URI);
    // Clean up any residual data before tests run
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test database and close connection
    await User.deleteMany({});
    await disconnectDB();
  });

  // Reusable test user credentials
  const validUser = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  // 1. Health Endpoint Test
  describe('GET /api/health', () => {
    it('should return 200 OK and server status without leaking secrets', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptimeSeconds');
      expect(res.body).not.toHaveProperty('JWT_SECRET');
      expect(res.body).not.toHaveProperty('mongoUri');
    });
  });

  // 2. User Registration Tests
  describe('POST /api/auth/register', () => {
    beforeEach(async () => {
      await User.deleteMany({});
    });

    it('should successfully register a new user and never return passwordHash', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Registration successful. Please log in.');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(validUser.username);
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('passwordHash');

      // Verify stored password in MongoDB is hashed with bcrypt
      const savedUser = await User.findOne({ email: validUser.email.toLowerCase() });
      expect(savedUser).not.toBeNull();
      expect(savedUser.passwordHash).toBeDefined();
      expect(savedUser.passwordHash).not.toBe(validUser.password);
      expect(savedUser.passwordHash.startsWith('$2')).toBe(true); // bcrypt prefix
    });

    it('should fail when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should fail with an invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'not-an-email',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid email/i);
    });

    it('should fail with a weak password (less than 8 chars or missing numbers/case)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          password: 'abc',
          confirmPassword: 'abc',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/password/i);
    });

    it('should fail when password and confirmPassword do not match', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          confirmPassword: 'DifferentPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Passwords do not match.');
    });

    it('should fail when registering an already registered email (duplicate prevention)', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validUser);

      // Attempt duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          username: 'another_name',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('An account with this email already exists.');
    });
  });

  // 3. User Login Tests
  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      await User.deleteMany({});
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('should log in successfully with valid credentials and return an HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful. Welcome back!');
      expect(res.body.user).toBeDefined();
      expect(res.body.user).not.toHaveProperty('passwordHash');

      // Check cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = cookies.join(';');
      expect(cookieStr).toContain('auth_token=');
      expect(cookieStr).toContain('HttpOnly');
    });

    it('should fail login with incorrect password with generic error message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('should fail login with unregistered email with generic error message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unregistered@example.com',
          password: 'AnyPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });
  });

  // 4. Protected Route Tests (/api/auth/me)
  describe('GET /api/auth/me (Protected Route)', () => {
    let authCookie = null;
    let registeredUser = null;

    beforeAll(async () => {
      await User.deleteMany({});
      await request(app).post('/api/auth/register').send(validUser);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      authCookie = loginRes.headers['set-cookie'];
      registeredUser = await User.findOne({ email: validUser.email.toLowerCase() });
    });

    it('should reject request without authentication token (HTTP 401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please log in to access this page.');
    });

    it('should return safe user profile when a valid cookie is supplied', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(validUser.username);
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
      expect(res.body.user).not.toHaveProperty('passwordHash');

      // Verify anti-caching headers on protected data
      expect(res.headers['cache-control']).toContain('no-store');
    });

    it('should reject request with an invalid or tampered token (HTTP 401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['auth_token=tampered_invalid_jwt_token; Path=/']);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid authentication token. Please log in again.');
    });

    it('should reject request with an expired token (HTTP 401)', async () => {
      // Create a token that expired 1 second ago
      const expiredToken = jwt.sign(
        { id: registeredUser._id },
        process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890abcdef',
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`auth_token=${expiredToken}; Path=/`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Your session has expired. Please log in again.');
    });
  });

  // 5. Logout & Session Invalidation Tests
  describe('POST /api/auth/logout', () => {
    it('should clear the authentication cookie and reject subsequent requests', async () => {
      // First, log in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(loginRes.status).toBe(200);

      // Perform logout
      const logoutRes = await request(app).post('/api/auth/logout');
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
      expect(logoutRes.body.message).toBe('Logged out successfully.');

      // Check that clearCookie was sent (maxAge=0 or expires in past)
      const logoutCookies = logoutRes.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();
      const cookieStr = logoutCookies.join(';');
      expect(cookieStr).toMatch(/auth_token=;/i);

      // Subsequent access without cookie must be rejected
      const protectedRes = await request(app).get('/api/auth/me');
      expect(protectedRes.status).toBe(401);
      expect(protectedRes.body.message).toBe('Please log in to access this page.');
    });
  });

  // 6. Security and Malformed Input Tests
  describe('Security and Error Handling', () => {
    it('should handle malformed JSON safely without crashing or leaking details', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "broken_json", "password": '); // Incomplete JSON

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/malformed json/i);
    });

    it('should return 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/resource not found/i);
    });
  });
});
