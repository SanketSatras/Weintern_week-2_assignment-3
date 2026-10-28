Secure Full-Stack User Authentication System
WeIntern Full-Stack Web Development Internship — Week 2, Assignment 3

A full-stack authentication application built with HTML, CSS, JavaScript, Node.js, Express.js, and MongoDB.

Features
- User registration and login
- Password hashing with bcryptjs
- JWT authentication stored in secure HttpOnly cookies
- Protected dashboard and profile endpoint
- Logout and session-cookie clearing
- Input validation and error handling
- Rate limiting and security headers
- MongoDB Atlas or local MongoDB support
- Jest and Supertest integration tests
- Postman API collection

Tech Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Security: bcryptjs, JWT, Helmet, express-rate-limit, express-validator
- Testing: Jest, Supertest, Postman


## 📁 Project Structure

```text
project/
├── .gitignore
├── README.md
├── package.json
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── tests/
│   │   └── auth.test.js
│   └── utils/
│       └── tokenUtils.js
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── dashboard.js
│   │   ├── login.js
│   │   └── register.js
│   ├── dashboard.html
│   ├── login.html
│   └── register.html
└── postman/
    └── Authentication_API.postman_collection.json
```

Requirements
- Node.js and npm
- MongoDB Atlas account or local MongoDB

Setup and Run
1. Install dependencies from the project root:
   npm run install:all
   Alternatively, run npm install inside backend/.

2. Configure the required environment variables in your local setup (database URI, JWT secret, port, and cookie settings). Keep secrets private and never commit credentials to GitHub.

3. Start the app from the project root:
   npm run dev
   Or use npm start for the standard start command.

4. Open these local pages:
   - Login: http://localhost:5001/login.html
   - Register: http://localhost:5001/register.html
   - Dashboard: http://localhost:5001/dashboard.html
   - Health check: http://localhost:5001/api/health

API Endpoints
Method	Endpoint	Purpose
GET	/api/health	Check server status
POST	/api/auth/register	Register a user
POST	/api/auth/login	Log in
GET	/api/auth/me	Get the logged-in user's profile
POST	/api/auth/logout	Log out

Tests and API Testing
Run automated tests from the project root:
npm test

To test manually, import postman/Authentication_API.postman_collection.json into Postman and set baseUrl to http://localhost:5001. Test registration, login, profile access, logout, and profile access [...]

Links
- GitHub Repository: Add your repository URL here.

Author
Name: Sanket Satras
Role: Full-Stack Web Development Intern
Program: WeIntern Full-Stack Web Development Internship
- Name: Add your preferred name
- Role: Full-Stack Web Development Intern
- Program: WeIntern Full-Stack Web Development Internship
