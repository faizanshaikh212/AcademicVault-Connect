# Enhanced Authentication System - Deployment Guide

## Overview

This guide covers the deployment of the enhanced authentication system with 2FA, email verification, password recovery, and advanced session management.

## Prerequisites

### Server Requirements
- Node.js 18+ 
- MongoDB 5.0+
- Redis (optional, for session storage)
- SMTP email service (Gmail, SendGrid, etc.)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required Configuration
NODE_ENV=production
PORT=5001
CLIENT_ORIGIN=https://yourdomain.com
MONGODB_URI=mongodb://localhost:27017/academic-vault
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
ENCRYPTION_SECRET=your-32-character-encryption-secret-key

# Email Configuration (Required for auth features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SUPPORT_EMAIL=support@yourdomain.com

# Optional but Recommended
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_SECURITY_MONITORING=true
```

## Installation Steps

### 1. Install Dependencies

```bash
# Server dependencies
cd server
npm install

# Client dependencies  
cd ../client
npm install
```

### 2. Database Setup

The system will automatically create the required collections and indexes on first run. Ensure MongoDB is running and accessible.

### 3. Email Service Configuration

#### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password as `SMTP_PASS`

#### Alternative Email Providers
- **SendGrid**: Use API key as password
- **Mailgun**: Configure SMTP credentials
- **AWS SES**: Use SMTP interface

### 4. Security Configuration

#### JWT Secret
Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Encryption Secret
Generate a 32-character encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Build and Start

```bash
# Build client
cd client
npm run build

# Start server
cd ../server
npm start
```

## Production Deployment

### Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/academic-vault
    depends_on:
      - mongo
    volumes:
      - ./logs:/app/logs

  mongo:
    image: mongo:5.0
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=academic-vault

volumes:
  mongo_data:
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] JWT secret is cryptographically secure (64+ characters)
- [ ] Encryption secret is exactly 32 characters
- [ ] SMTP credentials are valid and tested
- [ ] Database connection is secure (use MongoDB Atlas or secured instance)
- [ ] HTTPS is configured (Let's Encrypt recommended)

### Post-Deployment
- [ ] Test user registration flow
- [ ] Test email verification
- [ ] Test password reset
- [ ] Test 2FA setup and login
- [ ] Test session management
- [ ] Verify rate limiting is working
- [ ] Check security logs are being generated
- [ ] Test all authentication endpoints

## Monitoring and Maintenance

### Log Monitoring
Monitor these log events:
- `SECURITY ALERT` - Critical security events
- `Suspicious activity detected` - Potential threats
- `Rate limit exceeded` - Possible attacks
- `Authentication system error` - System issues

### Database Maintenance
```bash
# Create indexes (run once after deployment)
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "lockUntil": 1 })
db.sessions.createIndex({ "tokenId": 1 }, { unique: true })
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.verificationtokens.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

### Backup Strategy
- Daily MongoDB backups
- Backup encryption keys securely
- Test restore procedures regularly

## Troubleshooting

### Common Issues

#### Email Not Sending
1. Check SMTP credentials
2. Verify firewall allows SMTP ports
3. Check email service logs
4. Test with a simple email client

#### 2FA Not Working
1. Verify system time is synchronized
2. Check encryption secret is consistent
3. Test QR code generation
4. Verify TOTP library is working

#### Session Issues
1. Check JWT secret consistency
2. Verify cookie settings
3. Check session cleanup jobs
4. Monitor session database

#### Rate Limiting Too Aggressive
1. Adjust rate limit settings in environment
2. Check IP forwarding configuration
3. Verify proxy headers are set correctly

### Debug Mode
Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

## Performance Optimization

### Database Optimization
- Ensure proper indexes are created
- Monitor query performance
- Set up MongoDB connection pooling
- Consider read replicas for high traffic

### Caching
- Implement Redis for session storage
- Cache user data appropriately
- Use CDN for static assets

### Security Monitoring
- Set up log aggregation (ELK stack)
- Configure alerting for security events
- Monitor authentication metrics
- Regular security audits

## Rollback Procedures

### Database Rollback
1. Stop the application
2. Restore database from backup
3. Revert to previous application version
4. Update environment variables if needed
5. Restart application

### Feature Rollback
Use environment variables to disable features:
```bash
ENABLE_2FA=false
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=false
```

## Support and Maintenance

### Regular Tasks
- Monitor security logs daily
- Review authentication metrics weekly
- Update dependencies monthly
- Security audit quarterly

### Emergency Contacts
- Database administrator
- Email service provider support
- Security team
- Infrastructure team

## Compliance Notes

### GDPR Compliance
- User data encryption implemented
- Right to deletion supported
- Data processing logged
- Privacy policy updated

### Security Standards
- Password hashing with bcrypt
- Secure session management
- Rate limiting implemented
- Security event logging
- 2FA available for enhanced security