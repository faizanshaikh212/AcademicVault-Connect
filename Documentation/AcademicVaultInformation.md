# Academic Vault — System Information and Project Review

This document provides a full description of the Academic Vault project: motivation, problem statement, objectives, literature context, system analysis, system design, implementation details and testing strategy. It also contains a practical review of the repository and recommendations for next steps.

## 1. INTRODUCTION

### 1.1 Motivation

Managing, sharing and discovering academic resources (notes, timetables, syllabi, question papers, and course materials) is a recurring challenge for students and educators. Many institutions rely on fragmented systems: email, shared drives, or physical handouts. Academic Vault centralizes storage and access, while providing search, categorization, versioning and role-based access (student, teacher, admin), enabling discoverability and long-term preservation of academic content.

Key motivations:

- Reduce duplication and loss of academic resources.
- Provide a searchable, mobile-friendly repository for course materials.
- Allow collaborative features (upload, tagging, commenting, curated collections).
- Support lightweight premium features (subscriptions, notifications) as seen in the server code.

### 1.2 Problem Statement

1: INTRODUCTION

1.1 Motivation

Managing, sharing and discovering academic resources (notes, timetables, syllabi, question papers and project reports) is a common pain for students and teachers. Academic Vault centralizes these materials into a single searchable repository, adds structured metadata (course, subject, semester, tags) and provides role-based permissions so appropriate users can access and manage content.

1.2 Problem Statement

Materials are currently shared via messaging apps, email or unmanaged drives, causing:

- Missing or outdated resources
- Multiple versions with no canonical copy
- Difficulty in discovering past exam papers or lecture notes

Academic Vault provides a web client and REST API with cloud-backed media storage to host, preview and manage files to solve these problems.

1.3 Purpose/Objective & Goals

Purpose: Provide a reliable, easy-to-use platform for storing and discovering academic materials.

Objectives:

- Secure authentication and role-based authorization (student/teacher/admin)
- Resource CRUD with metadata and file uploads
- Search and filtering by course/subject/semester/tags
- Admin tools for moderation, and basic premium workflow support

  1.4 Literature Survey

Related systems:

- DSpace / EPrints — institutional repositories (heavyweight archival solutions)
- Moodle / Canvas — LMS platforms focused on course delivery
- Google Drive / OneDrive — general storage without academic metadata

Academic Vault fits between these: lighter than a full institutional repository and more focused on discovery than an LMS.

1.5 Project Scope & Limitation

Scope (v3.10):

- User registration/login with JWT tokens and role support
- Uploading, metadata management, preview and download of resources
- Client SPA (React + TypeScript) and server (Node.js + Express) with MongoDB

Limitations:

- No full-text PDF indexing (future enhancement)
- Not an LMS; no grading or assignment submission workflows

2: SYSTEM ANALYSIS

2.1 Existing System

Repository split:

- `client/` — React + TypeScript SPA (Vite) with pages, components and API services
- `server/` — Node.js + Express with controllers, models, middleware and upload handling

Cloudinary is used for media in production; MongoDB stores users, resources and other metadata.

2.2 Scope and Limitation of Existing Systems

Covered features:

- Notes, timetables, syllabi and question paper resource types
- Role-based middleware (admin/teacher) and scheduled jobs (premium checks)

Limitations:

- Security hardening (refresh tokens, rate-limiting) required
- Business logic duplication across controllers; a `services/` layer is recommended
- Cloudinary-specific logic should be isolated to avoid vendor lock-in

  2.3 Project Perspective/Features

Key features:

- Authentication and role-based access
- Resource CRUD and metadata management
- Previews, thumbnails and downloads
- Admin panels and simple scheduled jobs

  2.4 Stakeholders

- Students: search and download materials
- Teachers: upload and curate resources
- Administrators: moderate content and manage subscriptions
- Developers: maintain and extend the platform

  2.5 Requirement Analysis

Functional requirements:

- FR1: User registration/login and profile management
- FR2: Upload resources with metadata
- FR3: Role-based CRUD and moderation
- FR4: Search and filter resources

Non-functional requirements:

- NFR1: Security — hashed passwords, token-based auth, input validation
- NFR2: Performance — indexes and pagination
- NFR3: Maintainability — modular code and documentation

3: SYSTEM DESIGN

3.1 Design Constraints

- Use Node.js + Express and MongoDB
- Media storage via Cloudinary or S3, behind an adapter
- Client must be TypeScript SPA
- Protect routes with role-aware middleware

  3.2 System Models (DFD)

High-level flow:

- Client SPA <-> REST API <-> MongoDB / Cloudinary
- Processes: auth, resource CRUD, upload service, notification jobs

  3.3 Entity Relationship (ER diagram)

Entities (textual):

- User { \_id, name, email, role, passwordHash }
- Resource { \_id, title, description, fileUrl, fileType, course, subject, semester, uploaderId, tags }
- Comment { \_id, resourceId, authorId, body }

  3.4 Data Model

Collections and fields:

- users: \_id, name, email (unique), role, passwordHash, createdAt
- resources: \_id, title, description, fileUrl, fileType, course, subject, semester, tags[], uploaderId, versions[], createdAt

Recommended indexes:

- users.email (unique)
- resources.title (text), resources.tags, resources.course

  3.5 User Interfaces

Screens:

# Academic Vault — System Information and Project Review

This document provides a clear, structured description of the Academic Vault project. It follows the numbered pattern you requested and uses proper Markdown headings for each major section and subsection.

## 1. INTRODUCTION

### 1.1 Motivation

Managing, sharing and discovering academic resources (lecture notes, timetables, syllabi, question papers, project reports and supplementary materials) is a frequent daily task for students, teachers and administrative staff. In many colleges and universities, these materials are exchanged through a variety of informal channels — messaging apps, email threads, departmental shared drives, and even printed handouts. That fragmentation causes lost time, duplicated effort, and confusion over which version of a file is authoritative.

Academic Vault is motivated by the desire to create a single, reliable place for academic materials where:

- Uploaders can attach rich metadata (course, semester, subject, tags) to make content discoverable.
- Consumers can quickly find the exact document they need (for example: "CE-3, Thermodynamics, Question Paper 2022").
- Administrators can moderate content and manage access, ensuring compliance and quality.

Beyond convenience, this improves learning outcomes (students spend less time searching and more time studying), reduces repeat uploads of the same material, and provides an auditable history of resources for accreditation or review.

### 1.2 Problem Statement

Current problems observed in typical academic contexts:

- No canonical repository: multiple copies of the same resource appear in different systems, making it hard to know which is current.
- Poor metadata: file names alone are inadequate for search and filtering across courses and semesters.
- Weak access controls: files meant for a particular class or batch sometimes circulate publicly.
- Limited previewing: users must download files to inspect them, which is slow on mobile or limited-bandwidth connections.

Academic Vault addresses these issues by combining a disciplined metadata model, role-based access control, in-browser previews (for images and common document formats), and an API-driven backend that can be consumed by a modern SPA or other integrations.

### 1.3 Purpose / Objective & Goals

Purpose statement

The purpose of Academic Vault is to provide an easy-to-use, maintainable platform that centralizes academic materials and improves discoverability, access control and maintainability.

Objectives (concrete and testable):

- Authentication & Authorization: Implement secure registration and login, support roles (student, teacher, admin) and ensure endpoints enforce permissions.
- Resource Management: Support CRUD operations for resources with required metadata (title, course, subject, semester, tags) and optional fields (notes, related links).
- Media Handling: Allow direct uploads to a cloud provider (Cloudinary in production) and generate optimized previews and thumbnails for fast browsing.
- Search & Filtering: Implement server-side filtering and text-search on titles/descriptions to support discovery at scale.
- Maintainability: Organize server code into controllers, services and models to make test coverage and future refactors easier.

Success criteria (how we know the release meets objectives):

- Users can register and login with proper role assignment and access-restrictions enforced by middleware tests.
- Upload -> store -> view workflow completes end-to-end in less than a few seconds for typical files (depending on network).
- Search returns relevant results with correct pagination and respects visibility rules.
- Basic test suite (unit + integration) covers authentication and resource CRUD.

### 1.4 Literature Survey

Concise comparative review of related platforms and why Academic Vault selects its approach:

- Institutional repositories (DSpace, EPrints): built for long-term archival, rich metadata and preservation workflows. They are excellent for institutional archives but are heavyweight and slower to adapt for course-level workflows.
- Learning Management Systems (Moodle, Canvas): focused on delivering course material and grading, with deep integrations for assignments and grading. Academic Vault aims to focus instead on searchable resource discovery and lightweight publishing.
- Cloud storage platforms (Google Drive, OneDrive): ubiquitous and convenient but lack academic-specific metadata and role-driven, fine-grained content discovery.

Academic Vault chooses a middle path: an approachable, developer-friendly stack (React + Node + MongoDB) that supports essential academic metadata and easy integration with cloud media providers.

### 1.5 Project Scope & Limitations

Scope (v3.10 - this release):

- Core user flows: registration, login, role assignment, and profile edits.
- Resource workflows: upload, update metadata, list resources (with filters), preview and download.
- Admin capabilities: moderate resources, manage premium requests and run scheduled checks (e.g., premium expiry).
- Client & Server: SPA client (React + TypeScript + Vite) and REST API server (Node.js + Express) with MongoDB as the datastore and Cloudinary for media in production.

Explicit limitations and out-of-scope items for this release:

- Full-text indexing and relevance-ranking for large PDFs (recommendation: integrate ElasticSearch/OpenSearch in a future release).
- Assignment submission, grading workflows, or deep LMS features.
- Enterprise SSO integrations (e.g., SAML/CAS) — future roadmap item if needed by institutions.

Operational assumptions:

- The system will be deployed to a managed environment where environment variables and secrets are available (no hard-coded credentials).
- Cloudinary (or equivalent) credentials exist for media handling in production; local file storage may be used for development.

## 2. SYSTEM ANALYSIS

### 2.1 Existing System

High-level inventory of what the repository currently contains and how it maps to the product:

- Client: `client/` directory with a React + TypeScript SPA, routing, pages, and reusable components. Tailwind and Vite are used for styling and fast dev builds.
- Server: `server/` directory with Express route controllers (auth, resource types like notes, syllabus, question papers), models (Mongoose), middleware (auth, admin, teacher), and service-like code for uploads.
- Jobs & Utilities: scheduled job scripts (e.g., `jobs/premiumExpirationCheck.js`) and utility modules for Cloudinary and database connection.

Operational observation: The codebase demonstrates a domain-oriented approach (separate controllers per resource type) which is good for clarity, but some shared logic is duplicated across controllers and would benefit from centralization.

### 2.2 Scope and Limitation of Existing Systems

What works well today:

- Clear separation of client vs. server responsibilities, making local development and deployment straightforward.
- Cloudinary integration provides immediate preview and image/document transformation benefits.
- Role-based middleware is present, indicating security-by-design intentions.

Where the current system is limited or risky:

- Authentication needs a refresh-token model and stricter policies for rate-limiting and account lockout to mitigate brute-force attacks.
- Upload logic is partly spread in controllers; centralizing it in a `services/uploadService.js` will make it easier to mock in tests and swap providers.
- The codebase lacks an automated test baseline for critical paths (auth, upload), increasing regression risk.

### 2.3 Project Perspective/Features

User-facing features (current + immediate future):

- Resource discovery: search, sort, filter, and category browsing.
- Resource consumption: in-app preview (images, PDFs where supported), download, and comment (if enabled).
- Upload & metadata: a robust form that validates required fields and allows tagging and optional notes.
- Admin panel: content moderation, user management and premium request handling.

System-level features:

- Scheduled jobs for premium expiration checks and notification triggers.
- Cloud-based media storage and transformation (Cloudinary), allowing thumbnails and optimized delivery.

### 2.4 Stakeholders

Primary stakeholders and their needs:

- Students: quick discovery, mobile-friendly viewing, and confidence that downloaded materials are the correct versions.
- Teachers: easy upload, ability to tag and organize materials, and control over visibility (course-only vs public).
- Administrators: moderation tools, user management and subscription handling.
- Developers: clear APIs, modular code, and testable services to maintain and extend the platform.

### 2.5 Requirement Analysis

Functional requirements (detailed):

- FR1 — Authentication: users must be able to create accounts, verify email (optional) and login securely. Admins and teachers have elevated privileges.
- FR2 — Resource CRUD: creators can upload, edit metadata, create new versions, and delete resources; viewers can preview and download resources based on visibility.
- FR3 — Search & Filtering: users can filter resources by course, subject, semester, tags and text in title/description.
- FR4 — Admin Features: admins can view pending moderation items, ban/activate users and process premium requests.

Non-functional requirements (detailed):

- NFR1 — Security: passwords must be stored hashed (bcrypt), tokens should expire, and sensitive endpoints must be rate limited.
- NFR2 — Performance: endpoints should paginate results, and common queries should be backed by indexes; previews should be cached/CDN-delivered.
- NFR3 — Reliability: uploads should be atomic (avoid orphaned DB records for failed uploads); scheduled jobs should be idempotent.
- NFR4 — Maintainability: code should be modular with a clear service layer and documented APIs for client integration.

## 3. SYSTEM DESIGN

### 3.1 Design Constraints

Architectural decisions and why they matter:

- Technology stack: Node.js/Express and MongoDB were chosen for rapid development and flexible document modeling for resources with variable metadata.
- Media: Cloudinary suits this project because it offers on-the-fly transformations and CDN delivery, reducing operational overhead for serving previews.
- Role-based access: mandatory middleware ensures endpoints enforce minimal privilege principles.
- Adapter pattern: keep Cloudinary calls isolated behind an `uploadService` to allow swapping providers or adding signed direct-to-cloud uploads in the future.

### 3.2 System Models (DFD)

Textual data flow overview (three short scenarios):

1. Upload flow:

- Client sends multipart/form-data to `/api/upload` with metadata.
- Server validates metadata and user permissions.
- UploadService streams file to Cloudinary (or stores locally for dev).
- On success, server writes a Resource document with file URL and metadata to MongoDB.

2. Search / browse flow:

- Client sends query (filters + pagination) to `/api/resources`.
- Server translates filters to a MongoDB query (using text indexes where appropriate) and returns paginated results with essential metadata and preview URLs.

3. Admin moderation flow:

- Admin requests a resource list filtered by `flagged=true`.
- Server returns flagged items; admin actions (approve/delete) update DB and optionally notify uploader.

### 3.3 Entity Relationship (ER diagram)

Human-readable ER description:

- User (\_id, name, email, role, passwordHash): the primary actor; roles control permitted actions.
- Resource (\_id, title, description, fileUrl, fileType, course, subject, semester, uploaderId, tags, versions, visibility): a resource can embed small arrays (tags, versions) for fast reads.
- Comment (\_id, resourceId, authorId, body, createdAt): optional attachments to resources for collaborative notes.
- PremiumSubscription (\_id, userId, plan, status, expiresAt): tracks paid features and expiry.

Indexes and performance notes:

- Text index on `resources.title` and `resources.description` for basic search.
- Multikey index on `resources.tags` to support tag-based lookups.
- Compound indexes for common filter combinations (e.g., course + semester + visibility).

### 3.4 Data Model

Example Mongoose schema decisions (high level):

- Embed small, immutable data (versions[] where each version is small) to ease read performance.
- Reference large or shared documents (uploaderId references `users._id`, course/subject may reference separate collections if normalization helps).

Data consistency suggestions:

- Use soft-deletes (a `deletedAt` timestamp) instead of hard deletes to allow accidental recovery and audit trails.
- For critical multi-document operations, consider MongoDB transactions when running on a replica set.

### 3.5 User Interfaces

Design and UX considerations (practical):

- Upload form: provide helpful inline validation (file size/type), show a progress bar for uploads and allow attaching tags and notes.
- Browse page: a clear search bar, filters (course/semester/type), and sort options (newest, most downloaded, most commented).
- Resource page: preview pane, metadata section, download button, version history and comment thread (if enabled).

Accessibility and mobile considerations:

- Ensure high-contrast colors, descriptive alt text for images and keyboard navigation for all interactive elements.
- Lazy-load previews and images to reduce mobile data usage; allow users to toggle low-bandwidth modes.

## 4. IMPLEMENTATION DETAILS

### 4.1 Software specifications

Concrete implementation notes and recommended packages:

- Backend: Express; use `express-validator` for request validation, `mongoose` for models, `bcrypt` for password hashing, `jsonwebtoken` for tokens, and `multer` (with memoryStorage) to accept uploads which are then sent to Cloudinary by the upload service.
- Frontend: React + TypeScript; use React Query (or SWR) for data fetching, React Hook Form for upload forms and validation, and TailwindCSS for rapid styling.
- Dev tooling: ESLint, Prettier, TypeScript, and Husky for pre-commit checks.

Security best practices:

- Store secrets in environment variables; never commit credentials.
- Enforce HTTPS in production and use secure cookies if you choose cookie-based auth.
- Add `helmet` for common security headers and `express-rate-limit` on auth endpoints.

Configuration & deployment:

- Support environment-specific config via `.env` files and a config module that picks values from `process.env`.
- Containerize the app for consistent deployments (Docker) and run behind a process manager or orchestrator.

### 4.2 Hardware specifications

Practical guidance for small-to-medium deployments:

- App server: 2 vCPU, 4 GB RAM should be adequate for an MVP serving hundreds of users; scale vertically if needed.
- Database: managed MongoDB (Atlas) with at least a small replica set to enable transactions and high availability.
- Media: Cloudinary or S3; rely on CDN for caching and fast edge delivery.

Operational notes:

- Monitor resource usage (CPU, memory) and response times; add auto-scaling if traffic is variable.
- For background processing (thumbnail generation, heavy file conversions), use a worker pool (Bull + Redis) separate from the web server.

## 5. TESTING

### 5.1 Test Plan

Testing approach and priorities:

- Unit tests: focus on validators, small pure utilities, and transformation functions (Jest).
- Integration tests: test API endpoints for auth and resource workflows (Supertest). Use a disposable test database and mock Cloudinary or use a sandbox account.
- Frontend tests: component tests for upload form and resource viewer (React Testing Library).
- E2E: automate critical user journeys (signup/login, upload, preview, admin moderation) using Cypress or Playwright.

Test data and environment:

- Maintain a small set of fixture data for tests (users of each role, a couple of sample resources, course/subject records).
- Reset or re-seed the test DB between test runs to keep tests deterministic.

CI recommendations:

- Run lint, type-check, unit and integration tests in CI on every PR. Keep E2E tests as a gated step for release branches.

### 5.2 Black Box Testing

Black-box tests to validate end-user behavior (examples with expected outcomes):

- Login flow: valid credentials grant a token and redirect; invalid credentials return 401 with friendly message.
- Upload flow: valid file + metadata creates a resource; UI shows progress, and resource appears in listing after upload.
- Permission enforcement: a student attempting an admin-only API should receive 403; UI should hide admin controls for students.

Acceptance criteria for black-box tests:

- API responses conform to documented status codes and payload shapes.
- UI shows clear success and error messages; inaccessible functionality is hidden or disabled.

### 5.3 White Box Testing

White-box tests and developer checks:

- Unit tests for auth middleware: simulate requests with valid/expired/invalid tokens and assert correct behavior.
- Upload service tests: mock Cloudinary responses and simulate partial failures to ensure DB/cleanup logic works (no orphan records).
- Model validation: test Mongoose schemas for required fields and index behavior (unique email constraint).

Coverage goals and practical enforcement:

- Aim for >70% coverage for core server modules (auth, upload, resource controllers) and critical client components.
- Use coverage thresholds in CI and require a minimum for merge, while prioritizing meaningful tests over chasing numbers.
