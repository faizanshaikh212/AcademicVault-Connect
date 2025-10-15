# Project Documentation — Academic Vault

> This document provides a comprehensive description of the Academic Vault project suitable for an academic assignment. It includes background, objectives, architecture, database design, implementation details, modules, testing, issues faced, future work, and references. The content is written for both technical evaluators and non-technical readers.

## 1. Introduction

Academic Vault is a web-based platform designed to help students, teachers, and academic staff store, share, and discover academic resources such as notes, question papers, timetables, syllabi, project reports, and announcements. The platform aims to make educational resources more accessible and better organized for college communities. It provides role-based access (students, teachers, admins), a search and categorization system, file upload and download functionality, and administration tools to manage content and users.

Academic Vault emphasizes usability and security. It combines a modern client-side application built with TypeScript and React (Vite) with a Node.js server and a MongoDB-backed storage layer (accessed via Mongoose). The platform supports media storage via Cloudinary, handles pagination and search on large resource sets, and offers admin workflows for content moderation and premium features.

### Objectives of the Project

- Build a centralized repository for academic resources that students and teachers can reliably use.
- Provide a clean, responsive, and accessible UI for browsing, searching, and consuming resources.
- Implement secure user authentication and role-based authorization for protected actions.
- Offer file upload/download mechanisms, with optional cloud media storage.
- Provide administrative tooling for content moderation, analytics, and user management.
- Build the system in modular components to make maintenance and future enhancements straightforward.

### Problem Statement

Many colleges rely on disorganized file shares, messaging apps, and informal channels for sharing study materials. This leads to duplicated effort, missing resources, version confusion, and difficulty finding past exam papers or structured notes. There is a need for a centralized, searchable archive that enables reliable access while enforcing permissions and content quality.

Academic Vault addresses these issues by providing a structured web application for storing and retrieving academic materials. It enforces metadata (course, semester, subject), supports rich search and filtering, and lets authorized users upload and tag resources so they are discoverable and reusable.

### Why I Chose This Project

I chose Academic Vault because it directly solves a recurring real-world problem experienced by students and teachers: fragmented resource sharing. This project allowed me to apply full-stack development skills — designing a database schema, building RESTful APIs, and creating a responsive front end — while also exploring practical topics like secure authentication, file handling, and deployment considerations. The project is well suited for a capstone or assignment because it has clear functional requirements, measurable success criteria, and room for extension.

### Existing System

In many institutions, sharing is done via:

- Unstructured messaging groups (WhatsApp, Telegram)
- Shared drives without consistent organization
- Emails with attachments and no indexing
- Ad-hoc websites or drives maintained by individual teachers

These systems lack searchability, standardized metadata, permission controls, and auditing. File naming is inconsistent, content is duplicated, and files are often lost over time.

### Proposed System

Academic Vault provides a well-defined platform with the following improvements:

- Centralized storage with a consistent metadata model (course, semester, subject, tags, uploader)
- Role-based access: Students can browse and download public resources; teachers can upload and manage content; admins can moderate and manage users.
- Search and filters for efficient resource discovery.
- Optional cloud-backed media hosting for scalability and reliability.
- Simple admin dashboards for analytics and moderation.

### System Features

- User authentication (register, login, password reset) with secure password hashing.
- Role-based authorization (student, teacher, admin).
- Upload and management of files (notes, timetables, question papers, syllabi, projects).
- File metadata and tagging for advanced filtering.
- Pagination and server-side filtering for performance with large datasets.
- News, notifications, and static pages management.
- Administrative panels for user management, premium subscriptions, and content moderation.
- Basic analytics and scheduled jobs (e.g., premium subscription expiry checks).

## 2. Academic Vault Overview

This section outlines the high-level architecture, major components, and main technologies used in the project.

### Technologies Used

- Frontend: React (TypeScript) using Vite, Tailwind CSS for styling, and modern React patterns (hooks, context API).
- Backend: Node.js (Express) — RESTful API design, middleware for authentication and authorization.
- Database: MongoDB (NoSQL, document-oriented) accessed via Mongoose or the native MongoDB driver for flexible schema and horizontal scaling.
- File storage: Local filesystem for development; Cloudinary for production-ready media hosting.
- Authentication: JWT (JSON Web Tokens) for stateless session management, bcrypt for password hashing.
- Dev tooling: ESLint, TypeScript, Prettier, git for version control.

### System Architecture

Academic Vault follows a typical three-tier architecture:

1. Presentation Layer (Client)
   - A single-page application built with React and TypeScript. The client handles routing, UI state, form validation, and calls backend APIs for data.
2. Application Layer (Server)
   - Node.js with Express exposes REST endpoints for authentication, file uploads, resources CRUD, and admin operations. Middleware handles authentication, role-based access, request validation, and error handling.
3. Data Layer (Database and Storage)
   - MongoDB stores persistent data as JSON-like documents in collections. Documents model users, resources, notifications and related metadata. Files and media are stored on the server or an external CDN-like service (Cloudinary) with references stored inside documents.

Inter-layer communication is via secure HTTP/HTTPS and JSON payloads. The server performs input validation, access checks, and data normalization. For performance and scale, the server supports pagination, basic caching strategies (e.g., Redis could be used later), and asynchronous processing for heavy tasks.

## 3. Database Design

This section explains the collections, document-modeling decisions, and design choices for MongoDB used by Academic Vault.

### Document Model & Collections

MongoDB stores data as documents in collections rather than normalized relational tables. Below is a recommended collection layout and notes on modeling choices:

- users collection — stores user documents: { \_id, name, email, passwordHash, role, isActive, createdAt }
- resources collection — stores uploaded items and metadata. Use references for large relations and embed small arrays like tags: { \_id, title, description, fileUrl, fileType, fileSize, courseId, subjectId, semesterId, uploaderId, tags: [], visibility, createdAt }
- courses collection — { \_id, name, code }
- subjects collection — { \_id, courseId, name }
- semesters collection — { \_id, name }
- notifications collection — { \_id, userId, title, body, isRead, createdAt }
- premiumRequests collection — { \_id, userId, status, details, createdAt }
- fileUploadLogs collection — optional logs for uploads and storage metrics

Modeling notes:

- Embed vs reference: embed when related data is small and read together (e.g., tags). Reference when data is large or shared across many documents (e.g., users, courses).
- Indexing: Create indexes on fields used for filtering and sorting (e.g., { courseId: 1 }, { subjectId: 1 }, and text indexes on title/description for search).
- Transactions: Use MongoDB multi-document transactions only when atomicity across multiple collections is required (replica set required).

### DFD (Data Flow Diagram)

(Also best represented visually; provide a high-level DFD description.)

- External Entities: User (students/teachers/admins), External CDN (Cloudinary), Email service (for notifications)
- Processes: Client -> Server API -> Database/File Storage
  - Process 1: User Authentication (client sends creds -> server verifies -> DB -> token returned)
  - Process 2: Resource Upload (client posts file -> server validates/auth -> store file -> write metadata to DB -> return resource id)
  - Process 3: Resource Search (client query -> server performs DB query with filters -> return paginated results)
  - Process 4: Admin Actions (moderation requests -> server updates resource.flags -> notifications sent)

### Collections and Sample Mongoose Schemas

Below are compact Mongoose schema examples you can use or adapt. They are intentionally concise for inclusion in your assignment.

```js
// models/User.js
const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", UserSchema);
```

```js
// models/Resource.js
const mongoose = require("mongoose");
const ResourceSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tags: [String],
    visibility: {
      type: String,
      enum: ["public", "private", "restricted"],
      default: "public",
    },
  },
  { timestamps: true }
);
ResourceSchema.index({ title: "text", tags: 1, courseId: 1 });
module.exports = mongoose.model("Resource", ResourceSchema);
```

```js
// models/Course.js -- compact
const CourseSchema = new mongoose.Schema({ name: String, code: String });
module.exports = mongoose.model("Course", CourseSchema);
```

## 4. Implementation Details

This section dives into implementation strategies, code organization, and key snippets and practices used in Academic Vault.

### Backend (Node.js & MongoDB)

Project structure highlights (server):

- `server.js` — application entry point; configures Express, middleware, and routes.
- `config/db.js` / `config/mongoose.js` — MongoDB/Mongoose connection setup.
- `controllers/*.controller.js` — route handlers for resources, auth, users, notifications.
- `models/*.model.js` — model definitions and schema relations.
- `routes/*.routes.js` — RESTful route definitions mounting controllers.
- `middleware/` — auth, admin, teacher authorization middleware and input validation.
- `services/` — file handling, local storage helpers, cloudinary integration.
- `utils/` — JWT token generation, logger utility, common helpers.

Key considerations:

- Use Mongoose models and parameterized queries where needed; sanitize inputs and validate request bodies to prevent injection-style attacks.
- Organize controllers to keep route handling thin and delegate heavy logic to services.
- Implement rate-limiting and input validation in middleware for endpoints that accept uploads or free-form input.

### Frontend (HTML, CSS, JavaScript / React + TypeScript)

Project structure highlights (client):

- `client/src/main.tsx` — application bootstrap and router mounting.
- `client/src/App.tsx` — application shell and global providers.
- `client/src/pages/` — page components categorized by role (public, admin, teacher).
- `client/src/components/` — shared UI components, layout, and background effects.
- `client/src/services/` — small wrapper services that call the backend API endpoints.
- `client/src/lib/` — small helper modules (avatar generation, cloudinary URL helpers).

Key considerations:

- Use TypeScript for type-safe components and API contracts.
- Keep UI components small, reusable, and documented with prop types and brief comments.
- Use Context for auth state and global app config. Use custom hooks for common behaviors (toast, copy-to-clipboard, auth wrapper).

### Hashing Passwords for Secure Login

- Use `bcrypt` or `bcryptjs` on the server to hash passwords before storing them in the database.
- Store only the hashed value and never store plaintext passwords.
- On registration: hash the password with a secure salt rounds value (e.g., 10–12) and save the hash.
- On login: compare provided password with stored hash using `bcrypt.compare`.
- Additional protections: enforce strong password policy, rate-limit login attempts, and consider account lockout or CAPTCHA on repeated failures.

### Connecting Backend with Frontend

- The frontend communicates with backend API over HTTPS using REST endpoints.
- Use a shared API base URL in a single config file (e.g., `client/src/config/api.ts`).
- Use an authorization header bearer token for authenticated requests: `Authorization: Bearer <JWT>`.
- For file uploads, use multipart/form-data and keep the upload route protected via middleware. The server should return the stored file URL and resource metadata.
- Implement client-side form validation before submission and server-side validation as a second line of defense.

### Appendix — Compact Code Snippets

Below are small, practical examples you can paste into your project or Word document. They are intentionally compact and focused on common tasks.

1. Express: registration and login (bcrypt + JWT)

```js
// server/controllers/auth.controller.js (compact, Mongoose)
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash: hash });
  await user.save();
  res.status(201).json({ message: "User created" });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("passwordHash _id");
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token });
};
```

2. Example: Mongoose query to get resources by course and subject

```js
// example: get resources by course and subject (Mongoose)
const Resource = require("../models/Resource");

async function getResources(courseId, subjectId, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const q = { courseId, subjectId };
  const docs = await Resource.find(q)
    .select("_id title fileUrl createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize)
    .lean();
  return docs;
}
```

3. File upload route using multer and Cloudinary (compact)

```js
// server/routes/upload.routes.js (compact)
const express = require("express");
const multer = require("multer");
const { cloudinaryUpload } = require("../services/cloudinary");
const Resource = require("../models/Resource");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file");
  const result = await cloudinaryUpload(req.file.buffer, {
    folder: "academic-vault",
  });
  // Save result.secure_url to DB as resource.fileUrl using Mongoose
  const resource = new Resource({
    title: req.body.title || req.file.originalname,
    fileUrl: result.secure_url,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    uploaderId: req.user && req.user._id,
  });
  await resource.save();
  res.json({ url: result.secure_url, id: resource._id });
});
```

4. Minimal React Login component (functional, TypeScript-style pseudocode)

```tsx
// client/src/pages/Login.tsx (compact)
import React, { useState } from "react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) sessionStorage.setItem("token", data.token);
  }

  return (
    <form onSubmit={submit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

5. Small API client wrapper (fetch + bearer token)

```js
// client/src/services/api.ts
export async function apiFetch(path, opts = {}) {
  const token = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...opts, headers });
  return res.json();
}
```

## 5. System Modules

A short explanation of the major modules and their responsibilities. These modules map to pages and routes in the system.

### Login Page

- Purpose: Authenticate users and establish a session using JWT tokens.
- Features: email/username input, password input, remember-me option, forgot password link, validation errors.
- Flow: On successful authentication the client stores the JWT (in memory or secure cookie) and redirects to a role-appropriate dashboard.

### Home Page

- Purpose: Provide an entry point for discovering recent resources, featured content, and quick search.
- Features: search bar, featured resources, categories, quick filters by course/semester/subject, and announcements.
- Flow: Client queries paginated endpoints to fetch resource previews and displays them with lazy loading.

### Admin Page

- Purpose: Administer the site—manage content, users, premium requests, static pages, and site settings.
- Features: user lists, content moderation, static page editor, premium subscription handling, and site analytics.
- Flow: Admin routes are protected and only accessible to users with admin role. Actions performed here call secure server endpoints.

## 6. Issues Faced & Solutions

Below are typical issues encountered while building Academic Vault and pragmatic solutions or workarounds.

1. File handling and storage limits
   - Problem: Large file uploads cause timeouts or exceed storage limits.
   - Solution: Implement chunked uploads (if needed), set sensible size limits, use streaming, and offload storage to Cloudinary or S3.
2. Search performance on large datasets
   - Problem: Full-text searches on the database become slow as data grows.
   - Solution: Create indexes on searchable columns, use a dedicated search engine (Elasticsearch or PostgreSQL's full-text search) if necessary, or add caching for popular queries.
3. Authentication and session management
   - Problem: Improper token expiry handling can let stale tokens remain valid.
   - Solution: Implement refresh tokens, short-lived access tokens, and a token revocation strategy for logout or compromised accounts.
4. Role-based authorization complexities
   - Problem: Mixed permission checks across UI and backend can be inconsistent.
   - Solution: Centralize authorization logic in middleware and use consistent role checks in the client to hide protected UI.
5. CORS and client-server integration issues
   - Problem: CORS misconfiguration during local development prevents API calls.
   - Solution: Configure CORS properly in Express (restrict origins in production), and use environment-specific settings.
6. Data migration and schema changes

- Problem: Evolving schemas with live data.
- Solution: Use migration tools (e.g., migrate-mongo, Mongock, or custom scripts) and write reversible migrations. For MongoDB, tools like `migrate-mongo` (https://github.com/seppevs/migrate-mongo) or Mongock (https://www.mongock.io/) help apply versioned migrations and seed data reliably.

## 7. Testing & Debugging

Testing strategy used during development:

- Unit tests: Test core services and utilities with Jest or Mocha + Chai for key functions (token generation, DB helpers, file helpers).
- Integration tests: Run API tests that hit the real or a test database using tools like Supertest and an isolated test DB instance.
- Manual end-to-end checks: Deploy locally and run through user flows (register/login/upload/download, admin moderation).
- Linting and static analysis: ESLint and TypeScript compile-time checking to reduce runtime errors.
- Logging: Centralized logger with levels (info, warn, error) and request correlation IDs for tracing.

Debugging workflow:

- Reproduce issue locally with a failing request or UI action.
- Inspect server logs and stack traces.
- Add focused unit tests covering the failing logic.
- Use breakpoints or console logs and iterate until the root cause is found.

## 8. Future Enhancements

Ideas for improving Academic Vault:

- Add SSO (single sign-on) integration with campus credentials (LDAP, OAuth2) to simplify onboarding.
- Add a full-text search engine (Elasticsearch / OpenSearch) for faster, relevance-ranked search and faceted filtering.
- Add collaborative annotations and comments on resources for social learning.
- Add versioning for uploaded documents and the ability to revert to prior versions.
- Add advanced analytics and download metrics for resource popularity and suggested content.
- Add role-based moderation queues and better spam detection for user uploads.
- Internationalization (i18n) for multi-lingual support.
- Mobile app or PWA support for offline access and push notifications.

## 9. Conclusion

Academic Vault is a practical, full-stack web application that addresses a common need in educational environments: centralized, searchable, and secure storage of academic resources. The project demonstrates applied skills in database design, REST API construction, frontend architecture, and security best practices. It is structured for maintainability and provides many avenues for future growth such as search scaling, SSO, and collaborative features.

## 10. References

-- Express.js documentation — https://expressjs.com/
-- Node.js documentation — https://nodejs.org/en/docs/
-- MongoDB documentation — https://www.mongodb.com/docs/
-- Cloudinary docs — https://cloudinary.com/documentation
-- bcrypt npm package — https://www.npmjs.com/package/bcrypt
-- JSON Web Tokens (JWT) — https://jwt.io/
-- React documentation — https://reactjs.org/docs/getting-started.html
-- Vite documentation — https://vitejs.dev/
-- Tailwind CSS — https://tailwindcss.com/docs
-- Migration tools for MongoDB (e.g., migrate-mongo) — https://github.com/seppevs/migrate-mongo

---
