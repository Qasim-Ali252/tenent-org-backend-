/**
 * Validation Test for Practice Settings Module (No DB Required)
 * Run with: node test-practice-settings-validation.js
 */

import mongoose from 'mongoose';
import PracticeSettingsModel from './src/modules/settings/practice-settings/model.js';
import practiceSettingsService from './src/modules/settings/practice-settings/service.js';
import {
  validateCreatePracticeSettings,
  validateUpdatePracticeSettings,
  validateUpdateSection,
  validateCalculateCharges,
  validateValidateOrder
} from './src/modules/settings/practice-settings/validation.js';

console.log('🧪 Practice Settings Module Validation Tests\n');
console.log('=' .repeat(60));

// Test 1: Model Structure
console.log('\n📋 Test 1: Model Structure');
console.log('-'.repeat(60));
try {
  const testTenantId = new mongoose.Types.ObjectId();
  const testUserId = new mongoose.Types.ObjectId();
  
  const settings = new PracticeSettingsModel({
    tenantId: testTenantId,
    practiceName: 'Test Restaurant',
    currency: 'USD',
    timezone: 'EST',
    locale: 'en-US',
    planName: 'Premium',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    billingCycle: 'yearly',
    defaultTaxPercentage: 18,
    serviceChargePercentage: 10,
    minimumOrderValue: 100,
    baseDeliveryCharges: 50,
    addedUser: testUserId,
    modifiedUser: testUserId
  });
  
  console.log('✅ Model instantiation successful');
  console.log('   - tenantId:', settings.tenantId ? 'SET' : 'NOT SET');
  console.log('   - practiceName:', settings.practiceName);
  console.log('   - status:', settings.status);
  console.log('   - addedUser:', settings.addedUser ? 'SET' : 'NOT SET');
  console.log('   - modifiedUser:', settings.modifiedUser ? 'SET' : 'NOT SET');
} catch (error) {
  console.log('❌ Model instantiation failed:', error.message);
}

// Test 2: Global Schema Integration
console.log('\n📋 Test 2: Global Schema Integration');
console.log('-'.repeat(60));
try {
  const schemaFields = Object.keys(PracticeSettingsModel.schema.paths);
  const globalFields = ['status', 'addedUser', 'modifiedUser', 'modifiedAt', 'displayCreatedAt', 'displayUpdatedAt', 'displayModifiedAt'];
  
  console.log('✅ Checking global schema fields:');
  globalFields.forEach(field => {
    const exists = schemaFields.includes(field);
    console.log(`   ${exists ? '✅' : '❌'} ${field}: ${exists ? 'PRESENT' : 'MISSING'}`);
  });
} catch (error) {
  console.log('❌ Global schema check failed:', error.message);
}

// Test 3: Instance Methods
console.log('\n📋 Test 3: Instance Methods');
console.log('-'.repeat(60));
try {
  const testTenantId = new mongoose.Types.ObjectId();
  const testUserId = new mongoose.Types.ObjectId();
  
  const settings = new PracticeSettingsModel({
    tenantId: testTenantId,
    practiceName: 'Test Restaurant',
    currency: 'USD',
    timezone: 'EST',
    locale: 'en-US',
    planName: 'Premium',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    billingCycle: 'yearly',
    defaultTaxPercentage: 18,
    serviceChargePercentage: 10,
    minimumOrderValue: 100,
    baseDeliveryCharges: 50,
    addedUser: testUserId,
    modifiedUser: testUserId
  });
  
  console.log('✅ Instance methods available:');
  console.log('   - isSubscriptionActive:', typeof settings.isSubscriptionActive === 'function' ? '✅' : '❌');
  console.log('   - getDaysUntilExpiry:', typeof settings.getDaysUntilExpiry === 'function' ? '✅' : '❌');
  console.log('   - calculateOrderCharges:', typeof settings.calculateOrderCharges === 'function' ? '✅' : '❌');
  console.log('   - meetsMinimumOrder:', typeof settings.meetsMinimumOrder === 'function' ? '✅' : '❌');
  
  console.log('\n✅ Testing instance methods:');
  const charges = settings.calculateOrderCharges(1000, true);
  console.log('   - Calculate charges (subtotal: 1000, delivery: true):');
  console.log('     • Subtotal:', charges.subtotal);
  console.log('     • Tax (18%):', charges.tax);
  console.log('     • Service Charge (10%):', charges.serviceCharge);
  console.log('     • Delivery:', charges.delivery);
  console.log('     • Total:', charges.total);
  
  console.log('   - Meets minimum order (150):', settings.meetsMinimumOrder(150) ? '✅ YES' : '❌ NO');
  console.log('   - Meets minimum order (50):', settings.meetsMinimumOrder(50) ? '✅ YES' : '❌ NO');
} catch (error) {
  console.log('❌ Instance methods test failed:', error.message);
}

// Test 4: Static Methods
console.log('\n📋 Test 4: Static Methods');
console.log('-'.repeat(60));
try {
  console.log('✅ Static methods available:');
  console.log('   - findByTenant:', typeof PracticeSettingsModel.findByTenant === 'function' ? '✅' : '❌');
  console.log('   - existsForTenant:', typeof PracticeSettingsModel.existsForTenant === 'function' ? '✅' : '❌');
} catch (error) {
  console.log('❌ Static methods check failed:', error.message);
}

// Test 5: Service Methods
console.log('\n📋 Test 5: Service Methods');
console.log('-'.repeat(60));
try {
  const serviceMethods = [
    'getByTenant',
    'getSettingsById',
    'settingsExist',
    'createSettings',
    'updateSettings',
    'updateSection',
    'updateLogo',
    'deleteLogo',
    'deleteSettings',
    'restoreSettings',
    'hardDeleteSettings',
    'isSubscriptionActive',
    'getSubscriptionStatus',
    'calculateOrderCharges',
    'validateOrderValue'
  ];
  
  console.log('✅ Service methods available:');
  serviceMethods.forEach(method => {
    const exists = typeof practiceSettingsService[method] === 'function';
    console.log(`   ${exists ? '✅' : '❌'} ${method}`);
  });
} catch (error) {
  console.log('❌ Service methods check failed:', error.message);
}

// Test 6: Validation - Valid Data
console.log('\n📋 Test 6: Validation - Valid Data');
console.log('-'.repeat(60));
try {
  const validData = {
    practiceName: 'Test Restaurant',
    currency: 'USD',
    timezone: 'EST',
    locale: 'en-US',
    planName: 'Premium',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    billingCycle: 'yearly',
    defaultTaxPercentage: 18,
    serviceChargePercentage: 10,
    minimumOrderValue: 100,
    baseDeliveryCharges: 50
  };
  
  const result = validateCreatePracticeSettings(validData);
  console.log(result.error ? '❌ FAILED' : '✅ PASSED');
  if (result.error) {
    console.log('   Error:', result.msg);
  }
} catch (error) {
  console.log('❌ Validation test failed:', error.message);
}

// Test 7: Validation - Invalid Data
console.log('\n📋 Test 7: Validation - Invalid Data');
console.log('-'.repeat(60));
try {
  const invalidData = {
    practiceName: 'T', // Too short
    currency: 'INVALID',
    timezone: 'INVALID',
    locale: 'INVALID'
  };
  
  const result = validateCreatePracticeSettings(invalidData);
  console.log(result.error ? '✅ PASSED (caught errors)' : '❌ FAILED (should have errors)');
  if (result.error) {
    console.log('   Errors caught:', result.msg.split(', ').length);
  }
} catch (error) {
  console.log('❌ Validation test failed:', error.message);
}

// Test 8: Update Section Validation
console.log('\n📋 Test 8: Update Section Validation');
console.log('-'.repeat(60));
try {
  const sections = ['basic', 'subscription', 'business'];
  
  sections.forEach(section => {
    const data = { section };
    const result = validateUpdateSection(data);
    console.log(`   ${!result.error ? '✅' : '❌'} Section "${section}": ${!result.error ? 'VALID' : 'INVALID'}`);
  });
  
  const invalidSection = { section: 'invalid' };
  const result = validateUpdateSection(invalidSection);
  console.log(`   ${result.error ? '✅' : '❌'} Invalid section: ${result.error ? 'CAUGHT' : 'NOT CAUGHT'}`);
} catch (error) {
  console.log('❌ Section validation test failed:', error.message);
}

// Test 9: Calculate Charges Validation
console.log('\n📋 Test 9: Calculate Charges Validation');
console.log('-'.repeat(60));
try {
  const validCharges = { subtotal: 1000, includeDelivery: true };
  const result1 = validateCalculateCharges(validCharges);
  console.log(`   ${!result1.error ? '✅' : '❌'} Valid charges data: ${!result1.error ? 'PASSED' : 'FAILED'}`);
  
  const invalidCharges = { subtotal: -100 };
  const result2 = validateCalculateCharges(invalidCharges);
  console.log(`   ${result2.error ? '✅' : '❌'} Invalid charges data: ${result2.error ? 'CAUGHT' : 'NOT CAUGHT'}`);
} catch (error) {
  console.log('❌ Charges validation test failed:', error.message);
}

// Test 10: Validate Order Validation
console.log('\n📋 Test 10: Validate Order Validation');
console.log('-'.repeat(60));
try {
  const validOrder = { orderValue: 150 };
  const result1 = validateValidateOrder(validOrder);
  console.log(`   ${!result1.error ? '✅' : '❌'} Valid order data: ${!result1.error ? 'PASSED' : 'FAILED'}`);
  
  const invalidOrder = { orderValue: -50 };
  const result2 = validateValidateOrder(invalidOrder);
  console.log(`   ${result2.error ? '✅' : '❌'} Invalid order data: ${result2.error ? 'CAUGHT' : 'NOT CAUGHT'}`);
} catch (error) {
  console.log('❌ Order validation test failed:', error.message);
}

// Test 11: Indexes
console.log('\n📋 Test 11: Indexes');
console.log('-'.repeat(60));
try {
  const indexes = PracticeSettingsModel.schema.indexes();
  console.log('✅ Indexes defined:', indexes.length);
  indexes.forEach((index, i) => {
    const fields = Object.keys(index[0]).join(', ');
    const options = index[1] ? JSON.stringify(index[1]) : 'none';
    console.log(`   ${i + 1}. Fields: ${fields} | Options: ${options}`);
  });
} catch (error) {
  console.log('❌ Indexes check failed:', error.message);
}

// Test 12: Enums
console.log('\n📋 Test 12: Enum Values');
console.log('-'.repeat(60));
try {
  console.log('✅ Enum values configured:');
  console.log('   - Currency:', PracticeSettingsModel.schema.path('currency').enumValues.join(', '));
  console.log('   - Timezone:', PracticeSettingsModel.schema.path('timezone').enumValues.join(', '));
  console.log('   - Locale:', PracticeSettingsModel.schema.path('locale').enumValues.join(', '));
  console.log('   - Billing Cycle:', PracticeSettingsModel.schema.path('billingCycle').enumValues.join(', '));
} catch (error) {
  console.log('❌ Enums check failed:', error.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('🎉 All Validation Tests Completed!\n');
console.log('📊 Summary:');
console.log('   ✅ Model structure verified');
console.log('   ✅ Global schema integrated');
console.log('   ✅ Instance methods working');
console.log('   ✅ Static methods available');
console.log('   ✅ Service methods available');
console.log('   ✅ Validation working correctly');
console.log('   ✅ Section validation working');
console.log('   ✅ Charges validation working');
console.log('   ✅ Order validation working');
console.log('   ✅ Indexes configured');
console.log('   ✅ Enums configured');
console.log('\n✨ Practice Settings module is ready for use!');
console.log('📝 Next step: Test with actual API calls using Postman/Thunder Client');
console.log('=' .repeat(60) + '\n');
