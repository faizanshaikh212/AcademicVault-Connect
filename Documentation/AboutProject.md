# Academic Vault Project Documentation

## Project Overview

Academic Vault is a comprehensive academic networking platform built using the MERN stack (MongoDB, Express.js, React, Node.js) with TypeScript support. The application is packaged as a desktop application using PyWebView and PyInstaller.

## Technical Architecture

### Core Technology Stack

#### Frontend (Client)

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite with SWC for optimal performance
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM
- **API Communication**: Axios
- **State Management**: React Context API
- **Markdown Support**: react-markdown with rehype-raw and remark-gfm
- **Code Highlighting**: react-syntax-highlighter

#### Backend (Server)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time Communication**: Socket.IO
- **Authentication**: JSON Web Tokens (JWT)
- **File Storage**: Cloudinary
- **Password Security**: bcrypt.js

#### Desktop Application Wrapper

- **Framework**: PyWebView
- **Packaging**: PyInstaller
- **Code Protection**: PyArmor
- **Additional Libraries**: requests

## Project Structure

### Client-Side Structure (/client)

```
src/
├── components/
│   ├── admin/           # Admin panel components
│   ├── background/      # Visual effects components
│   ├── layout/         # Layout components (Navbar, Footer, etc.)
│   ├── shared/         # Reusable components
│   ├── text-animations/ # Text animation components
│   └── ui/             # UI components (Buttons, Inputs, etc.)
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/               # Utility libraries
├── pages/             # Application pages
├── services/          # API services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Server-Side Structure (/server)

```
├── config/            # Configuration files
├── controllers/       # Route controllers
├── jobs/             # Scheduled tasks
├── middleware/       # Express middleware
├── models/           # MongoDB models
├── routes/           # API routes
└── utils/            # Utility functions
```

## Features

### User Features

1. Authentication System

   - Login/Register
   - JWT-based authentication
   - Role-based access control

2. Profile Management

   - User profiles with customizable information
   - Profile picture upload via Cloudinary
   - Project showcase
   - Blog posts

3. Content Management

   - Blog creation and management
   - Project documentation
   - News articles
   - Static pages

4. Premium Features

   - Premium user subscriptions
   - Premium content access
   - Role request system

5. Networking
   - User network building
   - Contact management
   - Notification system

### Admin Features

1. User Management

   - User account management
   - Role management
   - Premium request handling

2. Content Management

   - Blog moderation
   - Project moderation
   - News management
   - Static page editing

3. System Management
   - Customer support
   - Contact request handling
   - System notifications

## Technical Specifications

### API Architecture

#### Authentication and Role Management APIs

##### Authentication

- `POST /api/auth/register` - User registration (defaults to student role)
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout

##### Role Management

- `POST /api/users/request-teacher-role` - Submit teacher role request
- `GET /api/admin/rolerequests` - Get all pending role requests (admin only)
- `POST /api/admin/rolerequests/:id` - Handle role request (admin only)
- `PUT /api/admin/users/:id/role` - Update user roles (admin only)

Each role request includes the following workflow:

1. User submits request with qualifications
2. Admin reviews request details
3. Admin approves/rejects request
4. Automatic notification dispatched
5. Role updated if approved

#### User Management APIs

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account
- `GET /api/users/:id/projects` - Get user projects
- `GET /api/users/:id/blogs` - Get user blogs

#### Content Management APIs

- `POST /api/blogs` - Create blog post
- `GET /api/blogs` - Get all blogs
- `GET /api/blogs/:id` - Get specific blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog

#### Project Management APIs

- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Admin APIs

- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/premium-requests` - Get premium requests
- `PUT /api/admin/premium-requests/:id` - Handle premium request

### Data Models

#### Role Management System

```typescript
interface User {
  _id: string;
  username: string;
  email: string;
  password: string; // Hashed
  role: string[]; // Array of roles: ["student", "teacher", "admin"]
  avatar: string;
  bio: string;
  projects: string[]; // Project IDs
  blogs: string[]; // Blog IDs
  premium: {
    isPremium: boolean;
    premiumSince: Date | null;
    premiumExpiry: Date | null;
    lastRenewal: Date | null;
    expiryNotified: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface RoleRequest {
  user: string; // User ID
  fullName: string;
  qualifications: string;
  bio: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
```

The role management system includes:

1. Multi-role Support

   - Student (default role)
   - Teacher (requires approval)
   - Admin (highest privilege)

2. Role Request System

   - Teachers can request role upgrade
   - Admins can approve/reject requests
   - Automatic notification system
   - Role history tracking

3. Role-based Access Control (RBAC)
   - Protected routes with role checks
   - Granular permission system
   - Middleware-based authorization
   - Admin-only features protection

#### Blog Model

```typescript
interface Blog {
  _id: string;
  title: string;
  content: string;
  author: string; // User ID
  tags: string[];
  category: string;
  isPremium: boolean;
  views: number;
  likes: string[]; // User IDs
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Project Model

```typescript
interface Project {
  _id: string;
  title: string;
  description: string;
  owner: string; // User ID
  collaborators: string[]; // User IDs
  tags: string[];
  category: string;
  isPremium: boolean;
  files: FileInfo[];
  status: "active" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
}
```

### State Management

#### Authentication Context

```typescript
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}
```

### Error Handling

#### API Error Structure

```typescript
interface APIError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}
```

### Real-time Features

#### Socket.IO Events

- `user:online` - User comes online
- `user:offline` - User goes offline
- `notification:new` - New notification
- `chat:message` - New chat message
- `project:update` - Project update
- `blog:comment` - New blog comment

### File Handling

#### Cloudinary Integration

```typescript
interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure: boolean;
}
```

#### File Upload Process

1. Client sends file to server
2. Server uploads to Cloudinary
3. Cloudinary returns URL and metadata
4. URL stored in database
5. Client receives success response

### Security Implementation

#### JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}
```

#### Password Hashing

- Algorithm: bcrypt
- Salt Rounds: 10
- Password Requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character

## Security Features

1. JWT-based authentication
2. Password hashing with bcrypt
3. Protected routes
4. Role-based access control
5. Secure file uploads
6. Input validation and sanitization

## Desktop Application Features

1. Embedded Node.js server
2. PyWebView browser window
3. Automatic server startup
4. Health check system
5. Server process management
6. Resource path management

## Environment Configuration

The application uses the following environment variables:

- MONGODB_URI: MongoDB connection string
- JWT_SECRET: Secret key for JWT
- CLOUDINARY_CLOUD_NAME: Cloudinary cloud name
- CLOUDINARY_API_KEY: Cloudinary API key
- CLOUDINARY_API_SECRET: Cloudinary API secret
- PORT: Server port (default: 5001)

## Build and Deployment

### Development Setup

1. Install dependencies:

   ```bash
   npm install           # Root dependencies
   cd client && npm install
   cd ../server && npm install
   ```

2. Setup Python environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install pywebview pyinstaller pyarmor requests
   ```

### Development Commands

- `npm run dev`: Run both client and server in development mode
- `npm run server`: Run server only
- `npm run client`: Run client only
- `npm run build`: Build client for production

### Production Build

1. Build the React application:

   ```bash
   npm run build
   ```

2. Obfuscate Python code:

   ```bash
   pyarmor gen --output dist_obfuscated main.py
   ```

3. Create executable:
   ```bash
   pyinstaller main.spec
   ```

## File Documentation Status

- ✅ Fully Documented Files
- 🟨 Partially Documented Files
- ❌ Pending Documentation

Detailed documentation status for all components is maintained in FileDocumentation.md.

## Additional Systems

### Newsletter System

#### Features

- Newsletter subscription management
- Guest and registered user subscriptions
- Subscription status tracking
- Email-based subscription handling
- Admin newsletter management interface

#### Data Model

```typescript
interface NewsletterSubscriber {
  _id: string;
  email: string;
  user?: string; // Optional user reference
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### News System

#### Features

- News article management
- Markdown content support
- Cover image handling
- Author attribution
- Tags and categorization
- Automatic notification dispatch

#### Data Model

```typescript
interface News {
  _id: string;
  title: string;
  content: string;
  summary: string;
  coverImage: string;
  author: string;
  isPublished: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Visual Components

#### Background Effects

- Aurora: Dynamic gradient background effect
- DarkVeil: Overlay component for modal backgrounds
- Galaxy: Interactive star field animation
- LightRays: Animated light beam effects
- Particles: Configurable particle system

#### Text Animations

- ScrollFloat: Text float animation on scroll
- ScrollReveal: Content reveal on scroll
- TextType: Typewriter text effect

### Customer Care System

#### Features

- Contact request tracking
- Support ticket management
- Admin response system
- Status tracking
- Priority management

#### Data Model

```typescript
interface ContactRequest {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: "pending" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Static Page Management

#### Features

- Admin-editable static pages
- Markdown support
- Version history
- Live preview
- SEO metadata management

#### Managed Pages

- About Us
- Terms and Conditions
- Privacy Policy
- Our Purpose
- Our Network

### Development and Build Tools

#### Node.js Integration

- Embedded Node.js runtime (v22.18.0)
- Custom Node.js binary packaging
- Automated process management
- Environment variable handling
- Cross-platform compatibility

#### Build Process Details

1. Client Build

   ```bash
   npm run build -w client
   ```

   - Vite optimization
   - Asset bundling
   - CSS minification
   - Code splitting

2. Server Processing

   ```bash
   pyarmor gen --output dist_obfuscated main.py
   ```

   - Code obfuscation
   - Anti-tampering protection
   - License management

3. Desktop Packaging
   ```bash
   pyinstaller main.spec
   ```
   - Resource bundling
   - Binary compilation
   - Dependency inclusion
   - Icon integration

### Real-time Systems

#### Real-time Communication

- WebSocket-based real-time updates
- Socket.IO for client-server communication
- Event-based notification system
- Real-time status updates

#### Notification Types and Handling

```typescript
interface Notification {
  recipient: string;
  sender: string;
  type: NotificationType;
  message?: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
}

type NotificationType =
  | "follow"
  | "friend_request"
  | "friend_request_accepted"
  | "message"
  | "project_mention"
  | "blog_comment"
  | "role_approved"
  | "role_rejected"
  | "premium_approved"
  | "premium_rejected"
  | "new_news"
  | "newsletter_status_change"
  | "premium_expired"
  | "premium_expiring"
  | "premium_renewed"
  | "premium_revoked";
```

#### Premium Management

```typescript
interface PremiumUser {
  isPremium: boolean;
  premiumSince: Date;
  premiumExpiry: Date;
  lastRenewal: Date;
  expiryNotified: boolean;
}

interface PremiumRequest {
  user: string;
  fullName: string;
  paymentMethodId: string;
  status: "pending" | "approved" | "rejected";
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Automated Tasks

1. Premium Management

   - Daily midnight expiration check
   - 7-day expiration warnings
   - Automatic status updates
   - Renewal notifications

2. Notification Dispatch
   - Real-time user notifications
   - Email notifications for premium status
   - Newsletter updates
   - System alerts

### Monitoring and Logging

#### Server-side Logging

```typescript
interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  timestamp: Date;
  message: string;
  context?: Record<string, any>;
}
```

#### Features

- Request logging
- Error tracking
- Performance monitoring
- Security event logging
- Audit trail maintenance

## Additional Resources

- Source Code: https://github.com/faiz-n-shk/academic-vault
- Bug Reports: https://github.com/faiz-n-shk/academic-vault/issues
- Author: Fayz212 (https://github.com/faiz-n-shk)
- License: MIT

This documentation provides a comprehensive overview of the Academic Vault project, including its architecture, features, and development processes. It serves as a central reference for understanding the project's structure and capabilities.
