/**
 * Fix password for users who can't log in due to double-hashing issue
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

// User schema
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    email: String,
    password: String,
    role: [String],
    isEmailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add the matchPassword method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

const fixUserPassword = async () => {
    try {
        await connectDB();

        const email = 'xthronegamer@gmail.com';
        console.log(`🔍 Looking for user: ${email}`);

        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log(`👤 Found user: ${user.username}`);
        console.log(`📧 Email verified: ${user.isEmailVerified}`);
        console.log(`🔑 Current password hash: ${user.password.substring(0, 20)}...`);

        // Prompt for new password
        console.log('\n🔐 Please enter the password you want to set for this user:');
        console.log('(This should be the same password you tried to login with)');

        // For now, let's set a temporary password that you can use
        const tempPassword = 'TempPass123!';
        console.log(`\n🔧 Setting temporary password: ${tempPassword}`);
        console.log('You can use this to login, then change it in settings');

        // Hash the new password properly
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Update the user's password
        await User.findByIdAndUpdate(user._id, {
            password: hashedPassword
        });

        console.log('✅ Password updated successfully!');
        console.log(`\n🚀 You can now login with:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${tempPassword}`);

        // Verify the password works
        const updatedUser = await User.findById(user._id);
        const passwordWorks = await bcrypt.compare(tempPassword, updatedUser.password);
        console.log(`\n🧪 Password verification test: ${passwordWorks ? '✅ PASS' : '❌ FAIL'}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing password:', error);
        process.exit(1);
    }
};

fixUserPassword();