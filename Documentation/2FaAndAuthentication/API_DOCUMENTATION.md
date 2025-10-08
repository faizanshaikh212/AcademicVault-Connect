# Enhanced Authentication API Documentation

## Overview

This document describes the enhanced authentication API endpoints with 2FA, email verification, password recovery, and session management.

## Base URL
```
Production: https://yourdomain.com/api/auth
Development: http://localhost:5001/api/auth
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

All endpoints are rate limited:
- Authentication endpoints: 10 requests per 15 minutes per IP
- Email endpoints: 3 requests per hour per IP/email
- 2FA endpoints: 5 requests per 15 minutes per IP

## Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "details": {
    "field": "specific error details"
  }
}
```

## Endpoints

### User Registration

#### POST /register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "email": "john@example.com",
  "requiresVerification": true
}
```

**Validation Rules:**
- `firstName`: 1-50 characters, letters and spaces only
- `lastName`: 1-50 characters, letters and spaces only  
- `username`: 3-30 characters, alphanumeric, underscore, hyphen
- `email`: Valid email format, max 255 characters
- `password`: 6-128 characters, must contain lowercase, uppercase, and number

---

### User Login

#### POST /login
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200) - Success:**
```json
{
  "_id": "user_id",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe", 
  "email": "john@example.com",
  "role": ["student"],
  "settings": {...},
  "profile": {...},
  "premium": {...},
  "token": "jwt_token",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response (200) - 2FA Required:**
```json
{
  "message": "2FA verification required.",
  "requires2FA": true,
  "email": "john@example.com"
}
```

**Response (401) - Email Not Verified:**
```json
{
  "message": "Please verify your email address before logging in.",
  "requiresVerification": true,
  "email": "john@example.com"
}
```

---

### Email Verification

#### POST /send-verification-email
Resend email verification link.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent successfully."
}
```

#### GET /verify-email/:token
Verify email address with token from email.

**Response (200):**
```json
{
  "message": "Email verified successfully. You can now log in.",
  "verified": true
}
```

---

### Password Recovery

#### POST /forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists in our system, a password reset link has been sent."
}
```

#### POST /reset-password/:token
Reset password with token from email.

**Request Body:**
```json
{
  "password": "NewSecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully. Please log in with your new password.",
  "success": true
}
```

---

### Two-Factor Authentication

#### POST /setup-2fa
Generate 2FA secret and QR code. Requires authentication.

**Response (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "Scan the QR code with your authenticator app and verify with a code to enable 2FA."
}
```

#### POST /verify-2fa-setup
Verify 2FA setup with TOTP code. Requires authentication.

**Request Body:**
```json
{
  "token": "123456"
}
```

**Response (200):**
```json
{
  "message": "2FA enabled successfully!",
  "backupCodes": [
    "ABCD1234",
    "EFGH5678",
    "..."
  ],
  "warning": "Save these backup codes in a secure location. You won't see them again."
}
```

#### POST /disable-2fa
Disable 2FA. Requires authentication and recent password verification.

**Request Body:**
```json
{
  "password": "current_password",
  "token": "123456"
}
```

**Response (200):**
```json
{
  "message": "2FA disabled successfully. All sessions have been logged out for security."
}
```

#### POST /verify-2fa-login
Complete login with 2FA verification.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "token": "123456"
}
```

**Alternative with backup code:**
```json
{
  "email": "john@example.com", 
  "password": "SecurePassword123!",
  "backupCode": "ABCD1234"
}
```

**Response (200):**
```json
{
  "_id": "user_id",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "role": ["student"],
  "settings": {...},
  "profile": {...},
  "premium": {...},
  "token": "jwt_token",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### Session Management

#### GET /sessions
List all active sessions for authenticated user.

**Response (200):**
```json
{
  "sessions": [
    {
      "_id": "session_id",
      "deviceName": "Chrome on Windows",
      "browser": "Chrome 91.0",
      "os": "Windows 10",
      "location": "New York, NY, US",
      "ip": "192.168.1.1",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastUsedAt": "2024-01-01T12:00:00.000Z",
      "expiresAt": "2024-01-31T00:00:00.000Z",
      "isCurrent": true,
      "loginMethod": "password_2fa",
      "isSecure": true
    }
  ]
}
```

#### DELETE /sessions/:id
Revoke a specific session. Requires authentication.

**Response (200):**
```json
{
  "message": "Session revoked successfully"
}
```

#### POST /sessions/revoke-all
Revoke all sessions (logout from all devices). Requires authentication.

**Response (200):**
```json
{
  "message": "All sessions revoked successfully. 3 sessions were terminated."
}
```

---

### Token Management

#### POST /refresh
Refresh access token using refresh token cookie.

**Response (200):**
```json
{
  "token": "new_jwt_token"
}
```

#### POST /logout
Logout and invalidate current session.

**Response (200):**
```json
{
  "message": "Logged out"
}
```

---

### Password Verification

#### POST /verify-password
Verify current password for sensitive operations. Requires authentication.

**Request Body:**
```json
{
  "password": "current_password"
}
```

**Response (200):**
```json
{
  "valid": true
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `AUTHORIZATION_FAILED` | Access denied |
| `ACCOUNT_LOCKED` | Account temporarily locked |
| `EMAIL_NOT_VERIFIED` | Email verification required |
| `TWO_FA_REQUIRED` | 2FA verification required |
| `INVALID_TOKEN` | Invalid or malformed token |
| `EXPIRED_TOKEN` | Token has expired |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `SERVER_ERROR` | Internal server error |

## Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Cookies

The API uses HTTP-only cookies for refresh tokens:
- `refreshToken`: Secure, HTTP-only, SameSite=Lax
- Expires in 30 days
- Automatically rotated on refresh

## Client Integration Examples

### JavaScript/Fetch
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();

// Store JWT token
localStorage.setItem('token', data.token);

// Use token in subsequent requests
const protectedResponse = await fetch('/api/auth/sessions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  credentials: 'include'
});
```

### React Hook Example
```javascript
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password, twoFactorCode = null) => {
    const endpoint = twoFactorCode ? '/api/auth/verify-2fa-login' : '/api/auth/login';
    const body = twoFactorCode 
      ? { email, password, token: twoFactorCode }
      : { email, password };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data);
      return { success: true };
    } else if (data.requires2FA) {
      return { requires2FA: true, email: data.email };
    } else if (data.requiresVerification) {
      return { requiresVerification: true, email: data.email };
    }
    
    throw new Error(data.message);
  };

  return { user, login, loading };
};
```

## Testing

### Test User Creation
For testing purposes, you can create test users with specific states:

```javascript
// Verified user
const verifiedUser = {
  firstName: "Test",
  lastName: "User", 
  username: "testuser",
  email: "test@example.com",
  password: "TestPassword123!",
  isEmailVerified: true
};

// User with 2FA enabled
const twoFAUser = {
  ...verifiedUser,
  twoFactorEnabled: true,
  twoFactorSecret: "encrypted_secret"
};
```

### Postman Collection
Import the provided Postman collection for comprehensive API testing with pre-configured requests and environment variables.

## Changelog

### v1.0.0 (Current)
- Initial release with enhanced authentication
- 2FA support with TOTP and backup codes
- Email verification system
- Password recovery with secure tokens
- Advanced session management
- Comprehensive security logging
- Rate limiting and brute force protection