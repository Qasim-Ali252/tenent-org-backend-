/**
 * Create a simple test user for Practice Settings testing
 * Run with: node create-test-user.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = 'mongodb://localhost:27017/foodops_dev';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const { UserModel } = await import('./src/modules/users/model.js');
    const { default: TenantModel } = await import('./src/modules/tenants/model.js');

    const testEmail = 'test@test.com';
    const testPassword = 'Test123!';

    // Check if user exists
    let user = await UserModel.findOne({ email: testEmail });
    
    if (user) {
      console.log('✅ Test user already exists');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Tenant ID: ${user.tenantOrgId || user.companyId || 'N/A'}`);
      
      // Make sure it's verified
      user.accountVerificationMethods = user.accountVerificationMethods || {};
      user.accountVerificationMethods.isEmailVerified = true;
      user.isAccountEnable = true;
      await user.save();
      
      console.log('\n✅ User is verified and ready to use!\n');
      return;
    }

    console.log('📝 Creating test user...');

    // Create a simple tenant/company first
    const tenant = new TenantModel({
      name: 'Test Organization',
      status: 'active'
    });
    await tenant.save();
    console.log(`✅ Created tenant: ${tenant._id}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create user
    user = new UserModel({
      fullName: 'Test User',
      email: testEmail,
      username: testEmail,
      password: hashedPassword,
      companyId: tenant._id,
      tenantOrgId: tenant._id,
      accountVerificationMethods: {
        isEmailVerified: true
      },
      isAccountEnable: true,
      isDeleted: false
    });

    await user.save();

    console.log('\n✅ Test user created successfully!');
    console.log('━'.repeat(50));
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('👤 User ID:', user._id);
    console.log('🏢 Tenant ID:', tenant._id);
    console.log('━'.repeat(50));
    console.log('\n📝 Use these credentials to sign in:');
    console.log(`
POST http://localhost:4000/api/v1/users/signin
Content-Type: application/json

{
  "username": "${testEmail}",
  "password": "${testPassword}"
}
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTestUser();
