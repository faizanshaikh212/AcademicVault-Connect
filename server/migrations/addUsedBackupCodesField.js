/**
 * Migration script to add twoFactorUsedBackupCodes field to existing users
 * Run this once to update existing users with 2FA enabled
 */

import User from '../models/user.model.js';
import mongoose from 'mongoose';

const addUsedBackupCodesField = async () => {
    try {
        console.log('Starting migration: Adding twoFactorUsedBackupCodes field...');

        // Connect to database if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // Update all users who have 2FA enabled but don't have the new field
        const result = await User.updateMany(
            {
                twoFactorEnabled: true,
                twoFactorUsedBackupCodes: { $exists: false }
            },
            {
                $set: { twoFactorUsedBackupCodes: [] }
            }
        );

        console.log(`Migration completed: Updated ${result.modifiedCount} users`);

        // Also update users who have the field but it's null
        const nullResult = await User.updateMany(
            {
                twoFactorEnabled: true,
                twoFactorUsedBackupCodes: null
            },
            {
                $set: { twoFactorUsedBackupCodes: [] }
            }
        );

        console.log(`Migration completed: Updated ${nullResult.modifiedCount} users with null values`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    addUsedBackupCodesField();
}

export default addUsedBackupCodesField;