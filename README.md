# 🌱 Flahaa

**Flahaa** is a full-stack SaaS application for managing agricultural
workers and day-to-day farm operations.

It helps farm owners and supervisors manage multiple farms, workers,
attendance, team tasks, and payroll from one centralized platform, with
role-based access control and farm-level data isolation.

> Built with the MERN stack: MongoDB, Express.js, React, and Node.js.

------------------------------------------------------------------------

## ✨ Features

### 🏡 Multi-Farm Management

-   Administrators can own and manage multiple farms.
-   Admins select the farm they want to manage before entering its
    dashboard.
-   Supervisors and workers are assigned to a specific farm.
-   Backend requests are scoped to the appropriate farm to prevent
    cross-farm data access.

### 👥 Worker Management

-   Create, view, update, and manage agricultural workers.
-   Store worker information such as CIN, phone, address, contract type,
    daily rate, status, and joining date.
-   Assign workers to supervisors.
-   Upload worker profile images using Cloudinary.

### 📅 Attendance Management

-   Record daily worker attendance.
-   Support `present`, `absent`, and `excused` statuses.
-   Record check-in and check-out information.
-   Create attendance records in bulk.
-   Retrieve attendance history and monthly attendance information.

### ✅ Team Task Management

-   Create and organize farm tasks.
-   Assign work to teams/workers.
-   Track task information and progress.
-   Keep tasks isolated by farm.

### 💰 Payroll Management

-   Generate and manage worker payroll.
-   Calculate salary using worker attendance and daily rate.
-   Support bonuses, deductions, and advances.
-   Track payroll status.
-   Generate payroll-related PDF documents.

### 🔐 Authentication & Authorization

-   JWT-based authentication.
-   Password hashing with bcrypt.
-   Role-based authorization.
-   Supported roles:
    -   **Admin**
    -   **Supervisor**
    -   **Worker**
-   Protected frontend routes.
-   Farm-level authorization for multi-tenant data isolation.
-   Account status validation for inactive users.

### ✉️ Registration & Invitations

-   Registration-token workflow for controlled account creation.
-   Email support through Nodemailer.
-   Role-aware registration.

### 📚 API Documentation

-   REST API documented with Swagger / OpenAPI.
-   Interactive Swagger UI available during development.

### 🧪 Testing

-   Unit tests with Vitest.
-   Integration/API tests with Supertest.
-   MongoDB Memory Server for isolated test databases.

------------------------------------------------------------------------

## 👤 Roles & Access

  -----------------------------------------------------------------------
  Role                                Description
  ----------------------------------- -----------------------------------
  **Admin**                           Owns farms, can select and manage
                                      their farms, workers, supervisors,
                                      attendance, tasks, and payroll.

  **Supervisor**                      Belongs to one farm and manages
                                      authorized operational resources
                                      for that farm.

  **Worker**                          Worker-level account linked to a
                                      worker profile and farm.
  -----------------------------------------------------------------------

Flahaa uses farm-scoped authorization on the backend. For
administrators, the requested farm must belong to the authenticated
admin. Non-admin users are automatically scoped to their assigned farm.

------------------------------------------------------------------------

## 🛠️ Tech Stack

### Frontend

-   React 19
-   Vite
-   React Router
-   Tailwind CSS
-   Zustand
-   TanStack React Query
-   Axios
-   Chart.js / React Chart.js 2
-   React Hot Toast
-   Lucide React

### Backend

-   Node.js
-   Express.js 5
-   MongoDB
-   Mongoose
-   JSON Web Token
-   bcrypt
-   Zod
-   Multer
-   Cloudinary
-   Nodemailer
-   PDFKit
-   Swagger
-   Helmet
-   CORS
-   Morgan

### Testing

-   Vitest
-   Supertest
-   MongoDB Memory Server

------------------------------------------------------------------------

## 🏗️ Project Architecture

Flahaa separates the client and API into two applications:

``` text
Flahaa/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── tests/
│   │   │   ├── integration/
│   │   │   └── unit/
│   │   ├── utils/
│   │   ├── validations/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

The backend follows a layered structure:

``` text
Route → Middleware → Controller → Service → Model → MongoDB
```

This keeps HTTP handling, business logic, authorization, validation, and
persistence separated.

------------------------------------------------------------------------

## 🔒 Multi-Tenant Security

One of Flahaa's core architectural goals is **farm-level tenant
isolation**.

A user must never be able to access another farm's protected data simply
by changing an ID in a request.

For non-admin users, the backend derives the farm scope from the
authenticated user's account. For administrators, the requested farm is
checked against farms owned by that administrator before the request is
allowed to continue.

``` text
Authenticated User
       │
       ▼
 Authentication Guard
       │
       ▼
 Role / Farm Resolution
       │
       ▼
   Scoped Farm ID
       │
       ▼
 Business Service
       │
       ▼
 Farm-filtered MongoDB Query
```

------------------------------------------------------------------------

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

-   Node.js
-   npm
-   MongoDB or a MongoDB Atlas database

Cloudinary and SMTP/Mailtrap credentials are required when using the
related upload and email features.

### 1. Clone the repository

``` bash
git clone https://github.com/Mouad-MCH/Flahaa.git
cd Flahaa
```

### 2. Install backend dependencies

``` bash
cd backend
npm install
```

Create your environment file:

``` bash
cp .env.example .env
```

Configure the required values in `.env`.

### 3. Start the backend

``` bash
npm run dev
```

By default, the backend runs on:

``` text
http://localhost:3030
```

### 4. Install frontend dependencies

Open another terminal:

``` bash
cd frontend
npm install
```

### 5. Start the frontend

``` bash
npm run dev
```

Vite will display the local frontend URL, normally:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

## ⚙️ Environment Variables

The backend includes a `.env.example` file. A typical development
configuration contains:

``` env
NODE_ENV=development
APP_STAGE=dev
PORT=3030

MONGODB_URI=your_mongodb_connection_string

BCRYPT_SALT_ROUNDS=10

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=15m

CORS_ORIGIN=http://localhost:5173

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

LOG_LEVEL=info

MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=
MAILTRAP_PASS=
```

Never commit your real `.env` file or production secrets.

------------------------------------------------------------------------

## 🔌 REST API

The backend exposes its main resources under `/api`.

  Resource              Base endpoint
  --------------------- ----------------------------
  Authentication        `/api/auth`
  Farms                 `/api/farms`
  Users                 `/api/users`
  Workers               `/api/workers`
  Attendance            `/api/attendance`
  Tasks                 `/api/tasks`
  Payroll               `/api/payrolls`
  Registration Tokens   `/api/registration-tokens`

### Health Check

``` http
GET /health
```

### Swagger Documentation

With the backend running, open:

``` text
http://localhost:3030/api-docs
```

The raw OpenAPI specification is available at:

``` text
http://localhost:3030/api-docs.json
```

Protected endpoints use Bearer JWT authentication:

``` http
Authorization: Bearer <token>
```

------------------------------------------------------------------------

## 🧪 Running Tests

Run the backend test suite with:

``` bash
cd backend
npm test
```

The project uses Vitest, Supertest, and MongoDB Memory Server for unit
and integration testing without requiring the development database.

------------------------------------------------------------------------

## 🛡️ Security

Flahaa includes several security measures:

-   JWT authentication
-   bcrypt password hashing
-   Role-based access control
-   Farm-level multi-tenant authorization
-   Helmet security headers
-   CORS configuration
-   Request rate limiting
-   Zod request validation
-   Account status checks
-   Controlled file uploads
-   Environment-based secret management

------------------------------------------------------------------------

## 📌 Current Development Status

Flahaa is under active development.

The backend already contains the core farm-management domains, while the
frontend is being progressively connected to those features.
Authentication, protected routing, farm selection, farm guards, layout
infrastructure, and the dashboard foundation are present in the current
frontend.

Planned and ongoing frontend work includes completing the management
interfaces for workers, attendance, tasks, payroll, supervisors, and
other dashboard workflows.

------------------------------------------------------------------------

## 🎯 Project Goal

Flahaa aims to replace fragmented or manual agricultural workforce
management with a secure digital workflow where farm managers can:

**Manage farms → organize workers → record attendance → assign tasks →
calculate payroll**

while keeping each farm's data securely isolated.

------------------------------------------------------------------------

## 👨‍💻 Author

Developed by **Mouad MCH**.

GitHub: `Mouad-MCH`

------------------------------------------------------------------------

## 📄 License

This project is currently provided as part of the Flahaa development
project. Add a dedicated license file before distributing or licensing
the project for third-party use.
