/**
 * User Token Model
 * Stores OAuth tokens for Google Drive access
 */

import mongoose from 'mongoose';

const userTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    googleTokens: {
        access_token: String,
        refresh_token: String,
        scope: String,
        token_type: String,
        expiry_date: Number
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
userTokenSchema.index({ userId: 1 });

const UserToken = mongoose.model('UserToken', userTokenSchema);

export default UserToken;