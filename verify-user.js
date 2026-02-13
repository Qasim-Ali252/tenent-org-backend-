/**
 * Script to manually verify a user's email
 * Run with: node verify-user.js <email>
 */

import mongoose from 'mongoose';
import { config } from './src/config/index.js';

const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node verify-user.js <email>');
  process.exit(1);
}

async function verifyUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.mongoConnectivityString || 'mongodb://localhost:27017/foodops_dev';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Import User model
    const { UserModel } = await import('./src/modules/users/model.js');

    // Find user
    const user = await UserModel.findOne({ email });

    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`📧 Found user: ${user.fullName} (${user.email})`);
    console.log(`   Current verification status: ${user.accountVerificationMethods?.isEmailVerified ? '✅ Verified' : '❌ Not Verified'}`);

    // Update verification status
    user.accountVerificationMethods = user.accountVerificationMethods || {};
    user.accountVerificationMethods.isEmailVerified = true;
    user.isAccountEnable = true;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    console.log('\n✅ User email verified successfully!');
    console.log('   You can now sign in with this account.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

verifyUser();
