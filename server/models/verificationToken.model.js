/**
 * Verification Token Model
 * Handles email verification and password reset tokens
 */

import mongoose from 'mongoose';

const verificationTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    type: {
        type: String,
        enum: ['email_verification', 'password_reset'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // MongoDB TTL index
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
verificationTokenSchema.index({ token: 1, type: 1 });
verificationTokenSchema.index({ user: 1, type: 1 });

const VerificationToken = mongoose.model('VerificationToken', verificationTokenSchema);

export default VerificationToken;