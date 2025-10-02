/**
 * One-time script to fix user email verification status
 * Run this if users can't log in after email verification
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

// Import models
const User = mongoose.model('User', new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    email: String,
    password: String,
    role: [String],
    isEmailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true }));

const fixUserVerification = async () => {
    try {
        await connectDB();

        // Find users who were created recently but not verified
        const recentUsers = await User.find({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
            isEmailVerified: false
        });

        console.log(`Found ${recentUsers.length} unverified recent users:`);

        for (const user of recentUsers) {
            console.log(`- ${user.email} (${user.username}) - Created: ${user.createdAt}`);
        }

        if (recentUsers.length > 0) {
            console.log('\n🔧 Fixing verification status for recent users...');

            const result = await User.updateMany(
                {
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                    isEmailVerified: false
                },
                {
                    $set: { isEmailVerified: true }
                }
            );

            console.log(`✅ Updated ${result.modifiedCount} users to verified status`);
        } else {
            console.log('✅ No unverified recent users found');
        }

        // Show all users status
        const allUsers = await User.find({}).select('email username isEmailVerified createdAt');
        console.log('\n📋 All users status:');
        allUsers.forEach(user => {
            console.log(`- ${user.email}: ${user.isEmailVerified ? '✅ Verified' : '❌ Not Verified'} (${user.createdAt.toISOString()})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing user verification:', error);
        process.exit(1);
    }
};

fixUserVerification();