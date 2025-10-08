# Enhanced Authentication System

## 🔐 Overview

This enhanced authentication system provides enterprise-grade security features for the Academic Vault application, including:

- **Two-Factor Authentication (2FA)** with TOTP and backup codes
- **Email Verification** for new user registration
- **Password Recovery** with secure email-based reset
- **Advanced Session Management** with device tracking and geolocation
- **Security Monitoring** with real-time threat detection
- **Professional Email Templates** for all authentication communications

## ✨ Features

### 🛡️ Security Features
- **Multi-Factor Authentication**: TOTP-based 2FA with QR code setup
- **Account Lockout Protection**: Automatic lockout after failed attempts
- **Rate Limiting**: Multi-tier protection against brute force attacks
- **Session Security**: Enhanced session tracking with device fingerprinting
- **Suspicious Activity Detection**: Real-time monitoring and alerting
- **Secure Token Management**: Cryptographically secure token generation

### 📧 Email System
- **Professional Templates**: Branded email templates for all communications
- **Verification Emails**: Secure email verification for new registrations
- **Password Reset**: Time-limited password reset links
- **Security Notifications**: Alerts for important security events
- **Delivery Tracking**: Comprehensive email delivery monitoring

### 🖥️ Session Management
- **Device Tracking**: IP address, browser, OS, and location tracking
- **Session Details**: Comprehensive session information display
- **Remote Logout**: Individual and bulk session termination
- **Security Indicators**: Visual indicators for 2FA-protected sessions

### 🎨 User Interface
- **Modern Components**: React components with Tailwind CSS styling
- **Responsive Design**: Mobile-first responsive design
- **Accessibility**: WCAG compliant interface elements
- **User Experience**: Intuitive flows for all security operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- SMTP email service (Gmail, SendGrid, etc.)

### Installation

1. **Install Dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Environment Setup**
   ```bash
   cp server/.env.example server/.env
   # Edit .env with your configuration
   ```

3. **Required Environment Variables**
   ```env
   # Core Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   ENCRYPTION_SECRET=your-32-character-encryption-secret
   MONGODB_URI=mongodb://localhost:27017/academic-vault
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Start the Application**
   ```bash
   # Development
   cd server && npm run dev
   cd client && npm run dev
   
   # Production
   cd client && npm run build
   cd server && npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### 2FA Setup
```http
POST /api/auth/setup-2fa
Authorization: Bearer <token>
```

#### Session Management
```http
GET /api/auth/sessions
Authorization: Bearer <token>

DELETE /api/auth/sessions/:id
Authorization: Bearer <token>
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## 🔧 Configuration

### Email Service Setup

#### Gmail Configuration
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the app password as `SMTP_PASS`

#### SendGrid Configuration
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Security Settings

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # requests per window
```

#### Feature Flags
```env
ENABLE_2FA=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_SECURITY_MONITORING=true
```

## 🧪 Testing

### Run Tests
```bash
cd server
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Test Categories
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication flow testing
- **Performance Tests**: Load and stress testing

## 🔍 Monitoring

### Security Events
The system logs comprehensive security events:
- Authentication attempts (success/failure)
- 2FA setup and usage
- Password changes and resets
- Session management activities
- Suspicious activity detection

### Metrics Dashboard
Monitor key security metrics:
- Active user sessions
- 2FA adoption rate
- Failed login attempts
- Account lockouts
- Email delivery rates

### Alerting
Automatic alerts for:
- Brute force attempts
- Suspicious login patterns
- Account lockouts
- System errors

## 🛠️ Development

### Project Structure
```
server/
├── controllers/           # Request handlers
├── middleware/           # Authentication & security middleware
├── models/              # Database models
├── routes/              # API routes
├── services/            # Business logic services
├── utils/               # Utility functions
├── jobs/                # Background jobs
└── __tests__/           # Test files

client/
├── src/
│   ├── components/auth/ # Authentication components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── context/        # React context
│   └── types/          # TypeScript types
```

### Adding New Features

1. **Backend**: Add routes, controllers, and services
2. **Frontend**: Create components and integrate with API
3. **Tests**: Write comprehensive tests
4. **Documentation**: Update API and user documentation

### Code Style
- **Backend**: ESLint + Prettier for JavaScript
- **Frontend**: ESLint + Prettier for TypeScript/React
- **Commits**: Conventional commit messages
- **Testing**: Jest for backend, React Testing Library for frontend

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Database secured
- [ ] Email service configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🔄 Migration

### From Basic Auth
If migrating from a basic authentication system:

1. **Database Migration**: Run migration scripts
2. **Environment Setup**: Add new environment variables
3. **Frontend Updates**: Update components and flows
4. **Testing**: Verify all functionality works

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions.

## 🐛 Troubleshooting

### Common Issues

#### Email Not Sending
- Check SMTP credentials
- Verify firewall settings
- Test with email client

#### 2FA Not Working
- Verify system time synchronization
- Check encryption secret consistency
- Test QR code generation

#### Session Issues
- Check JWT secret consistency
- Verify cookie settings
- Monitor session cleanup

### Debug Mode
```bash
LOG_LEVEL=debug npm start
```

### Support
- Check logs for error details
- Review security event logs
- Contact support team for critical issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

- **Documentation**: Check the docs directory
- **Issues**: Create a GitHub issue
- **Security**: Email security@academicvault.com
- **General**: Contact support@academicvault.com

---

**Built with ❤️ for Academic Vault**