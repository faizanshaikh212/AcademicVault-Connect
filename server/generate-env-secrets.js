#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generating secure secrets for your .env file...\n');

// Generate JWT Secret (64 bytes)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Generate Encryption Secret (32 bytes)
const encryptionSecret = crypto.randomBytes(32).toString('hex');
console.log('ENCRYPTION_SECRET=' + encryptionSecret);

console.log('\n✅ Copy these values to your .env file!');
console.log('⚠️  Keep these secrets secure and never commit them to version control.');