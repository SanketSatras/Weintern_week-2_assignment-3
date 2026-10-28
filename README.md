# Secure Full-Stack User Authentication System

A production-grade, secure, and accessible **User Authentication System** built with **Vanilla HTML5, CSS3, JavaScript** on the frontend, and **Node.js, Express, MongoDB, and Mongoose** on the backend. This project implements modern security best practices including **bcryptjs password hashing**, **cryptographically signed JSON Web Tokens (JWT)**, **tamper-proof HttpOnly SameSite cookies**, **rate limiting**, **anti-caching headers**, and **centralized error handling**.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Installation & Setup](#installation--setup)
   - [Clone / Workspace Directory](#1-project-directory)
   - [Install Dependencies](#2-install-dependencies)
   - [Environment Configuration](#3-environment-variable-configuration)
   - [MongoDB Setup (Local & MongoDB Atlas)](#4-mongodb-setup)
7. [Starting the Application](#starting-the-application)
8. [Frontend Pages & Access](#frontend-pages--access)
9. [Architecture & Security Implementation](#architecture--security-implementation)
   - [Authentication Flow](#authentication-flow)
   - [Password Hashing (bcryptjs)](#password-hashing-explained)
   - [JWT in HttpOnly Cookies vs localStorage](#jwt-in-httponly-cookies-vs-localstorage)
   - [Route Protection & Cache Control](#route-protection--cache-control)
   - [Immediate Revocation vs Cookie Clearance](#immediate-revocation-vs-cookie-clearance)
10. [API Endpoint Documentation](#api-endpoint-documentation)
    - [GET /api/health](#1-get-apihealth)
    - [POST /api/auth/register](#2-post-apiauthregister)
    - [POST /api/auth/login](#3-post-apiauthlogin)
    - [GET /api/auth/me](#4-get-apiauthme)
    - [POST /api/auth/logout](#5-post-apiauthlogout)
11. [Testing & Quality Assurance](#testing--quality-assurance)
    - [Automated Jest & Supertest Suite](#running-automated-tests)
    - [Postman Collection Import & Manual Testing](#postman-testing)
12. [Troubleshooting Guide](#troubleshooting-guide)
    - [Resolving Port Conflicts (EADDRINUSE)](#1-resolving-port-conflicts-eaddrinuse)
    - [Resolving MongoDB Connection Errors](#2-mongodb-connection-troubleshooting)
    - [CORS and Cookie Transmission Issues](#3-cors-and-cookie-transmission)
13. [Git Security & .env Exclusion](#git-security--env-exclusion)
14. [Production Deployment Considerations](#production-deployment-considerations)
15. [Manual Verification Checklist](#manual-verification-checklist)

---

## Project Overview

Authentication is the cornerstone of web security. This full-stack application provides an end-to-end reference implementation designed for both educational clarity and production security:
- **Zero Frontend Frameworks:** Built strictly with semantic HTML5, CSS3, and modern Vanilla JavaScript using the native Fetch API.
- **Defense in Depth:** Input validation on both client and server, rate limiting against brute force, secure HTTP headers via Helmet, and HttpOnly session cookies.
- **Privacy by Design:** Stored passwords never appear in plain text, password hashes are named `passwordHash` to denote their exact purpose, and hashes are systematically stripped from all JSON responses.

---

## Key Features

- **User Registration (`POST /api/auth/register`)**:
  - Validates username format, email syntax, and password strength (minimum 8 characters, uppercase, lowercase, number).
  - Confirms password matches confirmation field on both client and server.
  - Normalizes email addresses (lowercased and trimmed) to prevent case-variation duplicates.
  - Enforces database uniqueness via MongoDB unique indexes and gracefully handles duplicate key errors (`E11000`).
  - Hashes passwords using `bcryptjs` with configurable salt work factor.
  - Never logs or transmits plain passwords or password hashes.

- **User Login (`POST /api/auth/login`)**:
  - Verifies credentials using bcrypt constant-time comparison.
  - Emits a generic `"Invalid email or password."` error message to prevent account enumeration.
  - Issues a cryptographically signed JWT stored in an `HttpOnly`, `SameSite` cookie.
  - Includes rate limiting to safeguard against brute-force password guessing.

- **Protected Profile & Dashboard (`GET /api/auth/me` & `dashboard.html`)**:
  - Middleware inspects and validates the JWT signature and expiration.
  - Anti-caching headers (`no-store, no-cache, must-revalidate`) prevent sensitive dashboard views from persisting in browser history.
  - Direct navigation to `dashboard.html` without valid authentication immediately redirects to `login.html`.

- **Secure Logout Flow (`POST /api/auth/logout`)**:
  - Explicitly clears the authentication cookie with identical path and security flags.
  - Rejects any subsequent protected API requests after session termination.
  - Wipes DOM user content and uses `window.location.replace` to prevent back-button loops.

- **Automated Testing & API Collection**:
  - 17 comprehensive Jest & Supertest integration tests verifying every edge case against an isolated test database.
  - Ready-to-import Postman collection with sample request bodies and pre-configured test assertions.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5 | Semantic structure and accessible forms |
| | CSS3 (Vanilla) | Clean, responsive card UI, custom properties, focus rings |
| | Vanilla JavaScript | Asynchronous Fetch API, live validation, DOM updates |
| **Backend** | Node.js (v18+) | JavaScript server runtime |
| | Express.js (v4.21+) | REST API routing and middleware pipeline |
| **Database** | MongoDB (v7+) | Document storage with unique indexing |
| | Mongoose (v8.9+) | Schema validation, type casting, lifecycle hooks |
| **Security** | bcryptjs | Salted password hashing |
| | jsonwebtoken | Signed HMAC-SHA256 JWT generation and validation |
| | cookie-parser | Reading HttpOnly cookies from incoming requests |
| | helmet | Sets 11+ secure HTTP response headers |
| | express-rate-limit | Rate limiting against brute-force attacks |
| | express-validator | Declarative request sanitization and schema checks |
| **Testing** | Jest & Supertest | Automated API endpoint integration testing |

---

## Project Structure

```text
weintern week-2 Assignment - 3/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & lifecycle management
│   ├── controllers/
│   │   └── authController.js     # Handlers for register, login, me, logout, health
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT extraction, verification, & cache control
│   │   └── errorMiddleware.js    # 404 handler, JSON syntax, duplicate key sanitization
│   ├── models/
│   │   └── User.js               # Mongoose schema with unique indexes & safe serialization
│   ├── routes/
│   │   └── authRoutes.js         # Endpoint routes with express-validator & rate limiters
│   ├── utils/
│   │   └── tokenUtils.js         # JWT signing and HttpOnly cookie configuration
│   ├── tests/
│   │   └── auth.test.js          # Jest + Supertest suite (17 automated tests)
│   ├── .env.example              # Template configuration with placeholder values
│   ├── .env                      # Local environment configuration (never committed)
│   ├── .gitignore                # Excludes node_modules, .env, and logs
│   ├── package.json              # Backend dependencies and execution scripts
│   └── server.js                 # Express server bootstrap & static file serving
├── frontend/
│   ├── css/
│   │   └── style.css             # Unified stylesheet (clean cards, inputs, strength bar)
│   ├── js/
│   │   ├── register.js           # Client validation, live strength meter, Fetch POST
│   │   ├── login.js              # Client validation, flash message handler, Fetch POST
│   │   └── dashboard.js          # Protected data loader, logout handler, back-nav guard
│   ├── register.html             # User registration view
│   ├── login.html                # User login view
│   └── dashboard.html            # Protected user dashboard view
├── postman/
│   └── Authentication_API.postman_collection.json # Complete Postman test collection
├── .gitignore                    # Root repository Git exclusion rules
├── package.json                  # Root convenience scripts (start, test, dev)
└── README.md                     # Comprehensive documentation
```

---

## Prerequisites

Before starting, ensure you have the following installed on your operating system:
1. **Node.js**: Version `18.x` or higher (Verify with `node -v`).
2. **npm**: Version `9.x` or higher (Verify with `npm -v`).
3. **MongoDB**: Local MongoDB Community Edition (`v6.x` or `v7.x`) running on `127.0.0.1:27017`, **OR** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud cluster connection string.

---

## Installation & Setup

### 1. Project Directory
Open your terminal in the project directory:
```bash
cd "c:\Users\Rohit Satras\Downloads\weintern week-2 Assignment - 3"
```

### 2. Install Dependencies
Install all required Node.js backend packages:
```bash
# Option A: From the backend folder
cd backend
npm install

# Option B: From the root workspace directory
npm run install:all
```

### 3. Environment Variable Configuration
The backend uses `dotenv` to manage sensitive configuration variables. A template file [backend/.env.example](file:///c:/Users/Rohit%20Satras/Downloads/weintern%20week-2%20Assignment%20-%203/backend/.env.example) is provided.

Create your `.env` file in the `backend/` folder:
```bash
cd backend
cp .env.example .env
```

Your `backend/.env` file will look like this:
```env
# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5001

# Database Configuration (Development & Automated Tests)
MONGODB_URI=mongodb://127.0.0.1:27017/authentication_system
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/authentication_system_test

# Authentication & JWT Configuration
JWT_SECRET=c8e79b4a5d8f1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a
JWT_EXPIRES_IN=15m
COOKIE_NAME=auth_token
BCRYPT_SALT_ROUNDS=10
```

> [!TIP]
> **Generating a Secure Random JWT Secret:**
> Never use predictable phrases as JWT secrets. You can generate a cryptographically strong 256-bit hexadecimal secret with Node's crypto module:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. MongoDB Setup

#### Option A: Local MongoDB (Recommended for development)
1. Ensure the MongoDB service is active. On Windows:
   ```powershell
   Get-Service -Name MongoDB
   # If stopped:
   Start-Service -Name MongoDB
   ```
2. Verify local connectivity on default port `27017`:
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
   ```
3. Set `MONGODB_URI=mongodb://127.0.0.1:27017/authentication_system` in `backend/.env`. Mongoose will automatically initialize the database and collections upon the first write.

#### Option B: MongoDB Atlas (Cloud)
If you do not have local MongoDB installed:
1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a Database User with read and write permissions under **Database Access**.
3. Add your current IP address (or `0.0.0.0/0` for initial testing) under **Network Access**.
4. Click **Connect -> Drivers -> Node.js** and copy your connection string.
5. In `backend/.env`, update `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/authentication_system?retryWrites=true&w=majority
   ```

---

## Starting the Application

From the root directory or the `backend/` directory, start the server:

```bash
# Start standard server
npm start --prefix backend

# Or start with auto-reload (nodemon)
npm run dev --prefix backend
```

Expected startup output:
```text
[Database] MongoDB connected successfully: host=127.0.0.1, database=authentication_system
[Server] Authentication System running on http://localhost:5001
[Frontend] Accessible at http://localhost:5001/login.html
```

---

## Frontend Pages & Access

The Express backend serves the `frontend/` static folder directly, enabling the frontend and backend API to share an identical origin (`http://localhost:5001`). This completely eliminates CORS issues and guarantees reliable transmission of HttpOnly cookies across modern browser privacy engines.

| Page | URL | Description |
| :--- | :--- | :--- |
| **Root Redirect** | [http://localhost:5001/](http://localhost:5001/) | Automatically redirects browser to the login page |
| **Login** | [http://localhost:5001/login.html](http://localhost:5001/login.html) | Email and password sign-in form with flash messages |
| **Register** | [http://localhost:5001/register.html](http://localhost:5001/register.html) | Account creation with real-time password strength meter |
| **Dashboard** | [http://localhost:5001/dashboard.html](http://localhost:5001/dashboard.html) | Protected user profile view with verified active status |

---

## Architecture & Security Implementation

### Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as Frontend JS
    participant API as Express API
    participant DB as MongoDB

    Note over User,DB: Registration Flow
    User->>FE: Fill Username, Email, Password, Confirm
    FE->>FE: Validate length, email regex, match
    FE->>API: POST /api/auth/register
    API->>API: express-validator checks
    API->>DB: Query normalized email
    alt Email Exists
        DB-->>API: User record found
        API-->>FE: HTTP 400 "An account with this email already exists."
    else New User
        API->>API: bcrypt.hash(password, 10)
        API->>DB: Insert { username, email, passwordHash }
        DB-->>API: Saved User Document
        API-->>FE: HTTP 201 "Registration successful. Please log in."
        FE->>User: Show success banner & redirect to login.html
    end

    Note over User,DB: Login Flow
    User->>FE: Enter Email & Password
    FE->>API: POST /api/auth/login
    API->>DB: Find by normalized email
    API->>API: bcrypt.compare(password, passwordHash)
    alt Credentials Invalid
        API-->>FE: HTTP 401 "Invalid email or password."
    else Credentials Valid
        API->>API: jwt.sign({ id: user._id }, JWT_SECRET, 15m)
        API-->>FE: Set-Cookie: auth_token=...; HttpOnly; SameSite=Lax; Path=/<br>HTTP 200 Login Successful
        FE->>User: Redirect to dashboard.html
    end

    Note over User,DB: Protected Dashboard Request
    User->>FE: Open dashboard.html
    FE->>API: GET /api/auth/me (Cookie automatically sent)
    API->>API: Verify JWT signature & expiration
    alt Valid Token
        API->>DB: User.findById(id).select('-passwordHash')
        DB-->>API: Safe User Record
        API-->>FE: HTTP 200 { success: true, user: { username, email, createdAt } }
        FE->>User: Render profile details
    else Token Missing / Expired
        API-->>FE: HTTP 401 "Please log in to access this page."
        FE->>User: Redirect immediately to login.html
    end

    Note over User,DB: Logout Flow
    User->>FE: Click "Sign Out"
    FE->>API: POST /api/auth/logout
    API-->>FE: Clear-Cookie: auth_token=; Max-Age=0; Path=/<br>HTTP 200 Logged Out
    FE->>User: Clear DOM profile & redirect to login.html
```

### Password Hashing Explained
- Plain text passwords are **never** stored in the database.
- We use `bcryptjs` with a work factor of 10 (`BCRYPT_SALT_ROUNDS=10`). A cryptographically secure random salt is generated for each password before hashing, rendering precomputed rainbow tables useless.
- The schema field is explicitly named `passwordHash` to avoid ambiguity.
- The Mongoose model includes custom `toJSON` and `toObject` transforms that automatically strip `passwordHash` and `__v` whenever records are serialized.

### JWT in HttpOnly Cookies vs localStorage
| Criteria | HttpOnly Cookie (Used here) | localStorage (Insecure) |
| :--- | :--- | :--- |
| **XSS Vulnerability** | **Protected:** JavaScript cannot read `document.cookie` | **Vulnerable:** Malicious scripts can steal tokens immediately |
| **Transmission** | Automatically attached by browser on requests | Must be manually injected via Authorization headers |
| **CSRF Mitigation** | Guarded by `SameSite: 'lax'` or `'strict'` policies | Immune to CSRF, but vulnerable to XSS |
| **Security Standard** | OWASP recommended for browser applications | Not recommended for sensitive authentication tokens |

### Route Protection & Cache Control
The `protect` middleware ensures protected routes:
1. Extract the token from `req.cookies.auth_token` (or `Bearer` fallback for external clients).
2. Validate token signature and expiry.
3. Emit strict HTTP cache-control headers:
   ```http
   Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
   Pragma: no-cache
   Expires: 0
   ```
   This prevents browsers from rendering sensitive profile data if a user clicks the "Back" button after logging out.

### Immediate Revocation vs Cookie Clearance
When a user logs out (`POST /api/auth/logout`), the backend issues an instruction to clear the browser's cookie.
- **Cookie Clearance:** Removes the browser's copy of the JWT. The browser will no longer transmit the token.
- **Token Invalidation Note:** Because JWTs are stateless, if a token was intercepted prior to logout, it technically remains valid until its 15-minute expiration period lapses. In systems requiring instantaneous revocation across all devices, a server-side Redis token denylist or database session counter should be added.

---

## API Endpoint Documentation

### 1. GET /api/health
- **Description:** Verifies server responsiveness without exposing secrets.
- **Access:** Public
- **Response (200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-10-26T10:26:31.460Z",
  "uptimeSeconds": 60
}
```

---

### 2. POST /api/auth/register
- **Description:** Creates a new user with hashed password.
- **Access:** Public (Rate-limited: 30 requests/hour per IP)
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "username": "alex_rivera",
  "email": "alex.rivera@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```
- **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please log in.",
  "user": {
    "id": "6adf2adffad6410e855976e3",
    "username": "alex_rivera",
    "email": "alex.rivera@example.com",
    "createdAt": "2026-10-26T10:26:36.000Z"
  }
}
```
- **Validation Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Passwords do not match."
}
```
- **Duplicate Email Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "An account with this email already exists."
}
```

---

### 3. POST /api/auth/login
- **Description:** Authenticates credentials and sets `auth_token` in an HttpOnly cookie.
- **Access:** Public (Rate-limited: 15 requests/15 mins per IP)
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "alex.rivera@example.com",
  "password": "SecurePassword123!"
}
```
- **Response Headers:**
```http
Set-Cookie: auth_token=eyJhbGciOiJIUzI1Ni...; Path=/; HttpOnly; SameSite=Lax
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful. Welcome back!",
  "user": {
    "id": "6adf2adffad6410e855976e3",
    "username": "alex_rivera",
    "email": "alex.rivera@example.com"
  }
}
```
- **Failure Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

### 4. GET /api/auth/me
- **Description:** Returns the authenticated user's profile.
- **Access:** Protected (Requires valid `auth_token` cookie)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "6adf2adffad6410e855976e3",
    "username": "alex_rivera",
    "email": "alex.rivera@example.com",
    "createdAt": "2026-10-26T10:26:36.000Z"
  }
}
```
- **Unauthenticated / Expired Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Please log in to access this page."
}
```

---

### 5. POST /api/auth/logout
- **Description:** Clears the HttpOnly cookie and invalidates client session.
- **Access:** Public
- **Response Headers:**
```http
Set-Cookie: auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

## Testing & Quality Assurance

### Running Automated Tests
The automated test suite in [backend/tests/auth.test.js](file:///c:/Users/Rohit%20Satras/Downloads/weintern%20week-2%20Assignment%20-%203/backend/tests/auth.test.js) uses **Jest** and **Supertest** to test all 17 integration scenarios against a dedicated test database (`authentication_system_test`), keeping your development database completely untouched.

Execute tests via:
```bash
# Run tests directly inside the backend directory
cd backend
npm test

# Or run from the workspace root
npm test
```

**Test Scenarios Covered:**
1. `GET /api/health` returns status without leaking database credentials.
2. `POST /api/auth/register` creates user with bcrypt hash and excludes password fields in JSON.
3. Registration fails when required fields are missing.
4. Registration fails with invalid email format.
5. Registration fails with weak password (length < 8 or missing uppercase/numbers).
6. Registration fails when password and confirmPassword do not match.
7. Registration fails when attempting to use an existing email (duplicate constraint).
8. `POST /api/auth/login` sets signed JWT in HttpOnly cookie on valid credentials.
9. Login fails with incorrect password returning generic error message.
10. Login fails with unregistered email returning generic error message.
11. `GET /api/auth/me` rejects request when cookie is absent (401).
12. `GET /api/auth/me` returns safe user profile and anti-caching headers when cookie is valid (200).
13. `GET /api/auth/me` rejects request with invalid or tampered JWT (401).
14. `GET /api/auth/me` rejects request with expired JWT (401).
15. `POST /api/auth/logout` clears authentication cookie.
16. Protected endpoint rejects access after logout is completed.
17. Malformed JSON payloads return clean 400 response without crashing or exposing stack traces.

### Postman Testing
A ready-to-run Postman collection is located at:
`postman/Authentication_API.postman_collection.json`

**Import Instructions:**
1. Open Postman.
2. Click **Import** (top-left) and drag in `Authentication_API.postman_collection.json`.
3. The collection includes a pre-configured variable `baseUrl = http://localhost:5000`.
4. Ensure your server is running (`npm start`), then execute requests sequentially:
   - Run **2. Register New User**
   - Run **6. User Login - Success** (Postman automatically preserves the `auth_token` cookie)
   - Run **9. Get Authenticated Profile** (Returns 200 OK with user details)
   - Run **11. User Logout** (Clears cookie)
   - Run **12. Access Protected Endpoint After Logout** (Returns 401 Unauthorized)

---

## Troubleshooting Guide

### 1. Resolving Port Conflicts (EADDRINUSE)
If you see `Error: listen EADDRINUSE: address already in use :::5000`:
- **Windows (PowerShell):**
  ```powershell
  # Identify the process ID listening on port 5000
  netstat -ano | findstr :5000
  # Stop the conflicting process by its PID
  Stop-Process -Id <PID> -Force
  ```
- **macOS / Linux:**
  ```bash
  lsof -i :5000
  kill -9 <PID>
  ```
- Alternatively, modify `PORT=5001` in `backend/.env`.

### 2. MongoDB Connection Troubleshooting
- **Error: `connect ECONNREFUSED 127.0.0.1:27017`:**
  - Local MongoDB service is not started. Start it using `Start-Service MongoDB` on Windows, or `sudo systemctl start mongod` on Linux.
- **Error: `MongooseServerSelectionError: connection timed out`:**
  - If using MongoDB Atlas, check that your IP address is whitelisted under **Network Access** in the Atlas console.
- **Error: `E11000 duplicate key error collection`:**
  - An account already exists with that email. Either log in with that email or register with a unique email.

### 3. CORS and Cookie Transmission
If using a separate development server (e.g. VS Code Live Server on `5500`):
- Ensure `CLIENT_URL=http://localhost:5500` is set in `backend/.env`.
- Ensure all frontend `fetch()` calls specify `{ credentials: 'include' }`.
- Note: In the default setup, Express serves the frontend files on the same origin (`http://localhost:5000`), completely bypassing cross-origin restrictions.

---

## Git Security & .env Exclusion

To safeguard credentials and prevent accidental data leaks:
- Both `backend/.gitignore` and root `.gitignore` explicitly exclude `.env`, `.env.test`, `node_modules/`, and log files.
- Never commit active database connection strings or JWT secrets to version control.
- Always use `.env.example` to document required configuration keys with sanitized placeholder values.

---

## Production Deployment Considerations

Before deploying to production (e.g., Render, Railway, AWS, DigitalOcean):
1. **Set `NODE_ENV=production`**:
   - Enables `secure: true` on cookies (mandating HTTPS transmission).
   - Upgrades `sameSite: 'strict'` for maximum CSRF protection.
   - Suppresses stack traces on unexpected 500 server errors.
2. **Mandate HTTPS**: HttpOnly cookies flagged as `Secure` will not be accepted by browsers over unencrypted HTTP.
3. **Strong JWT Secret**: Use a 64-character random hexadecimal key generated via crypto.
4. **Reverse Proxy Configuration**: If deploying behind Nginx, Cloudflare, or AWS ALB, add `app.set('trust proxy', 1);` in `server.js` so that `express-rate-limit` and secure cookie flags accurately detect client IP addresses and SSL termination.

---

## Manual Verification Checklist

- [x] Server starts cleanly without errors on port 5001.
- [x] Connected to local MongoDB on port 27017.
- [x] `GET /api/health` returns 200 with server status.
- [x] Register new user returns 201 Created and saves hashed password.
- [x] Plain password is never saved in MongoDB; field is named `passwordHash`.
- [x] Register with duplicate email returns 400 Bad Request.
- [x] Password strength meter provides real-time visual feedback.
- [x] Login with valid credentials returns 200 OK and sets HttpOnly cookie.
- [x] Login with invalid credentials returns generic 401 without credential disclosure.
- [x] Direct navigation to `dashboard.html` without token redirects to `login.html`.
- [x] Valid session retrieves profile data with anti-caching headers.
- [x] Logout clears HttpOnly cookie.
- [x] Profile access after logout returns 401 Unauthorized.
- [x] 17 of 17 automated Jest/Supertest tests pass.
- [x] Full Postman collection provided and validated.
