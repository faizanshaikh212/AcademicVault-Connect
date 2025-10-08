# Migration Guide - Enhanced Authentication System

## Overview

This guide helps you migrate from the basic authentication system to the enhanced authentication system with 2FA, email verification, and advanced security features.

## Breaking Changes

### 1. Registration Flow Changes

**Before:**
```javascript
// Registration immediately logged in users
const response = await api.post('/auth/register', userData);
// User was immediately authenticated
```

**After:**
```javascript
// Registration requires email verification
const response = await api.post('/auth/register', userData);
if (response.data.requiresVerification) {
  // Redirect to email verification prompt
  showEmailVerificationPrompt(response.data.email);
}
```

### 2. Login Flow Changes

**Before:**
```javascript
// Simple login flow
const response = await api.post('/auth/login', { email, password });
if (response.data.token) {
  // User authenticated
}
```

**After:**
```javascript
// Enhanced login flow with multiple steps
const response = await api.post('/auth/login', { email, password });

if (response.data.token) {
  // Standard login success
  setUser(response.data);
} else if (response.data.requires2FA) {
  // Show 2FA verification form
  show2FAForm(response.data.email);
} else if (response.data.requiresVerification) {
  // Show email verification prompt
  showEmailVerificationPrompt(response.data.email);
}
```

### 3. User Model Changes

**New Fields Added:**
```javascript
{
  // Email verification
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Two-Factor Authentication
  twoFactorEnabled: Boolean,
  twoFactorSecret: String, // Encrypted
  twoFactorBackupCodes: [String], // Encrypted
  twoFactorVerified: Boolean,
  
  // Security tracking
  lastPasswordChange: Date,
  failedLoginAttempts: Number,
  lockUntil: Date
}
```

### 4. Session Model Changes

**Enhanced Fields:**
```javascript
{
  deviceInfo: {
    ip: String,
    ua: String,
    name: String,
    browser: String, // New
    os: String, // New
    location: { // New
      country: String,
      city: String,
      region: String
    }
  },
  isCurrent: Boolean, // New
  loginMethod: String // New: 'password' | 'password_2fa'
}
```

## Migration Steps

### Step 1: Database Migration

Run the following MongoDB commands to update existing data:

```javascript
// Add new fields to existing users
db.users.updateMany(
  {},
  {
    $set: {
      isEmailVerified: true, // Assume existing users are verified
      twoFactorEnabled: false,
      twoFactorVerified: false,
      lastPasswordChange: new Date(),
      failedLoginAttempts: 0
    },
    $unset: {
      emailVerificationToken: "",
      emailVerificationExpires: "",
      passwordResetToken: "",
      passwordResetExpires: "",
      twoFactorSecret: "",
      lockUntil: ""
    }
  }
);

// Update existing sessions
db.sessions.updateMany(
  {},
  {
    $set: {
      isCurrent: false,
      loginMethod: "password"
    }
  }
);

// Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "isEmailVerified": 1 });
db.users.createIndex({ "lockUntil": 1 });
db.sessions.createIndex({ "user": 1, "revoked": 1 });
db.sessions.createIndex({ "tokenId": 1 });
db.sessions.createIndex({ "expiresAt": 1 });
```

### Step 2: Environment Variables

Add new environment variables to your `.env` file:

```bash
# Email Configuration (Required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SUPPORT_EMAIL=support@yourdomain.com

# Encryption for 2FA secrets (Required - 32 characters)
ENCRYPTION_SECRET=your-32-character-encryption-secret

# Feature flags (Optional)
ENABLE_2FA=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_SECURITY_MONITORING=true

# Security settings (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Frontend Updates

#### Update Registration Component

**Before:**
```jsx
const handleSubmit = async (formData) => {
  const response = await api.post('/auth/register', formData);
  auth.login(response.data);
  navigate('/dashboard');
};
```

**After:**
```jsx
const [registrationStep, setRegistrationStep] = useState('form');
const [registeredEmail, setRegisteredEmail] = useState('');

const handleSubmit = async (formData) => {
  const response = await api.post('/auth/register', formData);
  
  if (response.data.requiresVerification) {
    setRegisteredEmail(response.data.email);
    setRegistrationStep('verification');
  } else {
    // Fallback for existing flow
    auth.login(response.data);
    navigate('/dashboard');
  }
};

// Add email verification component
if (registrationStep === 'verification') {
  return <EmailVerificationPrompt email={registeredEmail} />;
}
```

#### Update Login Component

**Before:**
```jsx
const handleSubmit = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  auth.login(response.data);
  navigate('/dashboard');
};
```

**After:**
```jsx
const [loginStep, setLoginStep] = useState('credentials');
const [userEmail, setUserEmail] = useState('');

const handleCredentialsSubmit = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  
  if (response.data.token) {
    auth.login(response.data);
    navigate('/dashboard');
  } else if (response.data.requires2FA) {
    setUserEmail(response.data.email);
    setLoginStep('2fa');
  } else if (response.data.requiresVerification) {
    setUserEmail(response.data.email);
    setLoginStep('verification');
  }
};

const handle2FASubmit = async (twoFactorData) => {
  const response = await api.post('/auth/verify-2fa-login', {
    email: userEmail,
    password: credentials.password,
    ...twoFactorData
  });
  
  auth.login(response.data);
  navigate('/dashboard');
};
```

#### Add New Components

Create these new components:
- `EmailVerificationPrompt`
- `TwoFactorSetup`
- `SecuritySettings`
- `SessionManager`
- `PasswordResetForm`

### Step 4: Update API Calls

#### Add Error Handling

```javascript
const apiCall = async (endpoint, data) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.response?.status === 423) {
      throw new Error('Account is temporarily locked.');
    } else if (error.response?.data?.requiresVerification) {
      // Handle email verification requirement
      return { requiresVerification: true, email: error.response.data.email };
    }
    throw error;
  }
};
```

#### Update Session Management

```javascript
// Enhanced session listing
const getSessions = async () => {
  const response = await api.get('/auth/sessions');
  return response.data.sessions; // Now includes device info, location, etc.
};

// Session revocation
const revokeSession = async (sessionId) => {
  await api.delete(`/auth/sessions/${sessionId}`);
};

const revokeAllSessions = async () => {
  await api.post('/auth/sessions/revoke-all');
  // This will log out the user from all devices
  auth.logout();
  navigate('/login');
};
```

### Step 5: Update User Settings

Add security settings to user profile:

```jsx
const SecuritySettings = () => {
  const [user, setUser] = useState(null);
  const [show2FASetup, setShow2FASetup] = useState(false);

  const enable2FA = () => {
    setShow2FASetup(true);
  };

  const disable2FA = async (password, token) => {
    await api.post('/auth/disable-2fa', { password, token });
    // Refresh user data
    const updatedUser = await api.get('/auth/me');
    setUser(updatedUser.data);
  };

  return (
    <div>
      <h2>Security Settings</h2>
      
      {user?.twoFactorEnabled ? (
        <div>
          <p>✅ Two-factor authentication is enabled</p>
          <button onClick={() => setShowDisable2FA(true)}>
            Disable 2FA
          </button>
        </div>
      ) : (
        <div>
          <p>⚠️ Two-factor authentication is disabled</p>
          <button onClick={enable2FA}>Enable 2FA</button>
        </div>
      )}
      
      {show2FASetup && (
        <TwoFactorSetup
          onComplete={() => {
            setShow2FASetup(false);
            // Refresh user data
          }}
          onCancel={() => setShow2FASetup(false)}
        />
      )}
    </div>
  );
};
```

## Gradual Migration Strategy

### Phase 1: Backend Deployment
1. Deploy enhanced backend with feature flags disabled
2. Run database migrations
3. Test existing functionality

### Phase 2: Email Verification
1. Enable email verification for new users only
2. Update registration flow
3. Monitor email delivery

### Phase 3: Enhanced Security
1. Enable rate limiting and security monitoring
2. Update session management
3. Add password reset functionality

### Phase 4: Two-Factor Authentication
1. Enable 2FA setup for existing users
2. Update login flow to handle 2FA
3. Encourage 2FA adoption

### Phase 5: Full Migration
1. Enable all security features
2. Update all frontend components
3. Monitor and optimize

## Testing Migration

### Test Scenarios

1. **Existing User Login**
   - Verify existing users can still log in
   - Check that they're marked as email verified
   - Ensure sessions work correctly

2. **New User Registration**
   - Test email verification flow
   - Verify email delivery
   - Test verification link functionality

3. **Password Reset**
   - Test forgot password flow
   - Verify reset email delivery
   - Test password reset functionality

4. **2FA Setup**
   - Test 2FA setup process
   - Verify QR code generation
   - Test backup codes

5. **Session Management**
   - Test session listing with device info
   - Test session revocation
   - Test "logout from all devices"

### Rollback Plan

If issues occur during migration:

1. **Disable New Features**
   ```bash
   ENABLE_EMAIL_VERIFICATION=false
   ENABLE_2FA=false
   ENABLE_PASSWORD_RESET=false
   ```

2. **Revert Database Changes**
   ```javascript
   // Remove new fields if necessary
   db.users.updateMany({}, {
     $unset: {
       isEmailVerified: "",
       twoFactorEnabled: "",
       // ... other new fields
     }
   });
   ```

3. **Deploy Previous Frontend**
   - Revert to previous frontend version
   - Ensure compatibility with basic auth flow

## Post-Migration Tasks

### 1. Monitor Security Logs
- Check for authentication errors
- Monitor suspicious activity alerts
- Review rate limiting effectiveness

### 2. User Communication
- Notify users about new security features
- Provide 2FA setup instructions
- Update help documentation

### 3. Performance Monitoring
- Monitor database query performance
- Check email delivery rates
- Monitor API response times

### 4. Security Audit
- Review security configurations
- Test all authentication flows
- Verify encryption is working correctly

## Support and Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check SMTP configuration
   - Verify email service credentials
   - Check spam folders

2. **2FA Not Working**
   - Verify encryption secret is set
   - Check system time synchronization
   - Test QR code generation

3. **Session Issues**
   - Check JWT secret consistency
   - Verify cookie settings
   - Monitor session cleanup

### Getting Help

- Check the deployment guide for configuration issues
- Review API documentation for endpoint changes
- Monitor security logs for authentication errors
- Contact support team for critical issues

## Conclusion

This migration introduces significant security improvements while maintaining backward compatibility where possible. Follow the phased approach to minimize disruption and ensure a smooth transition to the enhanced authentication system.