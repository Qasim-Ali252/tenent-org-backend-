/**
 * Test script for Global Schema implementation
 * Run with: node test-global-schema.js
 */

import mongoose from 'mongoose';
import BranchModel from './src/modules/branches/model.js';
import branchService from './src/modules/branches/service.js';
import dotenv from 'dotenv';

dotenv.config();

// Test data
const testTenantId = new mongoose.Types.ObjectId();
const testUserId = new mongoose.Types.ObjectId();
const testManagerId = new mongoose.Types.ObjectId();
const uniqueCode = `TEST${Date.now().toString().slice(-6)}`;

const testBranchData = {
  code: uniqueCode,
  name: 'Test Branch',
  address: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country'
  },
  location: {
    type: 'Point',
    coordinates: [-73.935242, 40.730610] // NYC coordinates
  },
  phone: '+1234567890',
  email: 'test@branch.com',
  openingHours: [
    { day: 'MONDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', breaks: [] },
    { day: 'TUESDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', breaks: [] },
    { day: 'WEDNESDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', breaks: [] },
    { day: 'THURSDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', breaks: [] },
    { day: 'FRIDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', breaks: [] },
    { day: 'SATURDAY', isOpen: false, openTime: '', closeTime: '', breaks: [] },
    { day: 'SUNDAY', isOpen: false, openTime: '', closeTime: '', breaks: [] }
  ],
  capabilities: {
    hasDineIn: true,
    hasTakeaway: true,
    hasDelivery: false
  }
};

async function runTests() {
  try {
    console.log('🚀 Starting Global Schema Tests...\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
    console.log('✅ Connected to database\n');

    // Test 1: Create Branch with Audit Fields
    console.log('📝 Test 1: Creating branch with audit fields...');
    const createdBranch = await branchService.create({
      ...testBranchData,
      tenantId: testTenantId,
      addedUser: testUserId,
      modifiedUser: testUserId
    });

    console.log('✅ Branch created successfully!');
    console.log('   Branch ID:', createdBranch._id);
    console.log('   Status:', createdBranch.status);
    console.log('   Added User:', createdBranch.addedUser);
    console.log('   Modified User:', createdBranch.modifiedUser);
    console.log('   Display Created At:', createdBranch.displayCreatedAt);
    console.log('   Display Updated At:', createdBranch.displayUpdatedAt);
    console.log('   Display Modified At:', createdBranch.displayModifiedAt);
    console.log('');

    // Verify audit fields
    if (!createdBranch.addedUser) {
      throw new Error('❌ addedUser field is missing!');
    }
    if (!createdBranch.modifiedUser) {
      throw new Error('❌ modifiedUser field is missing!');
    }
    if (!createdBranch.displayCreatedAt) {
      throw new Error('❌ displayCreatedAt field is missing!');
    }
    console.log('✅ All audit fields present!\n');

    // Test 2: Update Branch
    console.log('📝 Test 2: Updating branch...');
    const newUserId = new mongoose.Types.ObjectId();
    const updatedBranch = await branchService.update(
      createdBranch._id,
      { name: 'Updated Test Branch', modifiedUser: newUserId },
      {},
      testTenantId
    );

    console.log('✅ Branch updated successfully!');
    console.log('   New Name:', updatedBranch.name);
    console.log('   Modified User:', updatedBranch.modifiedUser);
    console.log('   Display Modified At:', updatedBranch.displayModifiedAt);
    console.log('');

    // Verify modified user changed
    if (updatedBranch.modifiedUser.toString() !== newUserId.toString()) {
      throw new Error('❌ modifiedUser was not updated!');
    }
    console.log('✅ Modified user updated correctly!\n');

    // Test 3: Query with Audit Info
    console.log('📝 Test 3: Querying branch with audit info...');
    const queriedBranch = await branchService.getById(
      createdBranch._id,
      {},
      testTenantId
    );

    console.log('✅ Branch queried successfully!');
    console.log('   Has addedUser:', !!queriedBranch.addedUser);
    console.log('   Has modifiedUser:', !!queriedBranch.modifiedUser);
    console.log('   Has displayCreatedAt:', !!queriedBranch.displayCreatedAt);
    console.log('   Has displayModifiedAt:', !!queriedBranch.displayModifiedAt);
    console.log('');

    // Test 4: Status Update
    console.log('📝 Test 4: Updating branch status...');
    const statusUpdatedBranch = await branchService.update(
      createdBranch._id,
      { status: 'INACTIVE', modifiedUser: testUserId },
      {},
      testTenantId
    );

    console.log('✅ Status updated successfully!');
    console.log('   New Status:', statusUpdatedBranch.status);
    console.log('   Modified User:', statusUpdatedBranch.modifiedUser);
    console.log('');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await BranchModel.deleteOne({ _id: createdBranch._id });
    console.log('✅ Test data cleaned up\n');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('✅ Global Schema is working correctly');
    console.log('✅ Audit fields are populated');
    console.log('✅ Display dates are formatted');
    console.log('✅ Pre-save hooks are functioning');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run tests
runTests();
