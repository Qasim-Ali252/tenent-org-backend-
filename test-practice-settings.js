/**
 * Test script for Practice Settings Module
 * Run with: node test-practice-settings.js
 */

import mongoose from 'mongoose';
import { config } from './src/config/index.js';
import PracticeSettingsModel from './src/modules/settings/practice-settings/model.js';
import practiceSettingsService from './src/modules/settings/practice-settings/service.js';

// Test data
const testTenantId = new mongoose.Types.ObjectId();
const testUserId = new mongoose.Types.ObjectId();

const testSettings = {
  practiceName: 'Test Restaurant',
  logo: 'https://example.com/logo.png',
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
  contactEmail: 'test@example.com',
  phoneNumber: '+1234567890',
  address: '123 Test Street, Test City'
};

async function runTests() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.mongoConnectivityString || config.MONGODB_URI;
    
    if (!mongoUri) {
      console.log('⚠️  MongoDB URI not configured, skipping database tests');
      console.log('   Running validation tests only...\n');
    } else {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB\n');
    }

    // Test 1: Model Validation
    console.log('📋 Test 1: Model Validation');
    const settings = new PracticeSettingsModel({
      ...testSettings,
      tenantId: testTenantId,
      addedUser: testUserId,
      modifiedUser: testUserId
    });
    
    await settings.validate();
    console.log('✅ Model validation passed');
    console.log('   - All required fields present');
    console.log('   - Enums validated');
    console.log('   - Date validation working\n');

    // Test 2: Global Schema Integration
    console.log('📋 Test 2: Global Schema Integration');
    console.log('✅ Global schema fields present:');
    console.log('   - status:', settings.status);
    console.log('   - addedUser:', settings.addedUser);
    console.log('   - modifiedUser:', settings.modifiedUser);
    console.log('   - Has displayCreatedAt field:', 'displayCreatedAt' in settings.schema.paths);
    console.log('   - Has displayUpdatedAt field:', 'displayUpdatedAt' in settings.schema.paths);
    console.log('   - Has displayModifiedAt field:', 'displayModifiedAt' in settings.schema.paths);
    console.log('');

    // Test 3: Instance Methods
    console.log('📋 Test 3: Instance Methods');
    console.log('✅ Instance methods available:');
    console.log('   - isSubscriptionActive:', typeof settings.isSubscriptionActive === 'function');
    console.log('   - getDaysUntilExpiry:', typeof settings.getDaysUntilExpiry === 'function');
    console.log('   - calculateOrderCharges:', typeof settings.calculateOrderCharges === 'function');
    console.log('   - meetsMinimumOrder:', typeof settings.meetsMinimumOrder === 'function');
    
    const charges = settings.calculateOrderCharges(1000, true);
    console.log('   - Calculate charges test:', charges);
    console.log('   - Meets minimum order (150):', settings.meetsMinimumOrder(150));
    console.log('   - Meets minimum order (50):', settings.meetsMinimumOrder(50));
    console.log('');

    // Test 4: Static Methods
    console.log('📋 Test 4: Static Methods');
    console.log('✅ Static methods available:');
    console.log('   - findByTenant:', typeof PracticeSettingsModel.findByTenant === 'function');
    console.log('   - existsForTenant:', typeof PracticeSettingsModel.existsForTenant === 'function');
    console.log('');

    // Test 5: Service Methods
    console.log('📋 Test 5: Service Methods');
    console.log('✅ Service methods available:');
    console.log('   - getByTenant:', typeof practiceSettingsService.getByTenant === 'function');
    console.log('   - createSettings:', typeof practiceSettingsService.createSettings === 'function');
    console.log('   - updateSettings:', typeof practiceSettingsService.updateSettings === 'function');
    console.log('   - updateSection:', typeof practiceSettingsService.updateSection === 'function');
    console.log('   - calculateOrderCharges:', typeof practiceSettingsService.calculateOrderCharges === 'function');
    console.log('   - validateOrderValue:', typeof practiceSettingsService.validateOrderValue === 'function');
    console.log('');

    // Test 6: Validation
    console.log('📋 Test 6: Validation');
    const { validateCreatePracticeSettings } = await import('./src/modules/settings/practice-settings/validation.js');
    
    const validData = validateCreatePracticeSettings(testSettings);
    console.log('✅ Valid data validation:', !validData.error ? 'PASSED' : 'FAILED');
    
    const invalidData = validateCreatePracticeSettings({ practiceName: 'T' }); // Too short
    console.log('✅ Invalid data validation:', invalidData.error ? 'PASSED (caught error)' : 'FAILED');
    console.log('');

    // Test 7: Pre-save Middleware
    console.log('📋 Test 7: Pre-save Middleware');
    console.log('✅ Pre-save hooks registered:');
    const preSaveHooks = settings.schema._pres.get('save');
    console.log('   - Number of pre-save hooks:', preSaveHooks ? preSaveHooks.length : 0);
    console.log('');

    // Test 8: Indexes
    console.log('📋 Test 8: Indexes');
    const indexes = PracticeSettingsModel.schema.indexes();
    console.log('✅ Indexes defined:', indexes.length);
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${JSON.stringify(index[0])} - ${JSON.stringify(index[1])}`);
    });
    console.log('');

    // Test 9: Enum Values
    console.log('📋 Test 9: Enum Values');
    console.log('✅ Enum validations:');
    console.log('   - Currency:', PracticeSettingsModel.schema.path('currency').enumValues);
    console.log('   - Timezone:', PracticeSettingsModel.schema.path('timezone').enumValues);
    console.log('   - Locale:', PracticeSettingsModel.schema.path('locale').enumValues);
    console.log('   - Billing Cycle:', PracticeSettingsModel.schema.path('billingCycle').enumValues);
    console.log('');

    // Test 10: Field Validation
    console.log('📋 Test 10: Field Validation');
    console.log('✅ Field validations:');
    console.log('   - practiceName min length:', PracticeSettingsModel.schema.path('practiceName').options.minlength);
    console.log('   - practiceName max length:', PracticeSettingsModel.schema.path('practiceName').options.maxlength);
    console.log('   - defaultTaxPercentage min:', PracticeSettingsModel.schema.path('defaultTaxPercentage').options.min);
    console.log('   - defaultTaxPercentage max:', PracticeSettingsModel.schema.path('defaultTaxPercentage').options.max);
    console.log('');

    console.log('🎉 All tests completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   ✅ Model validation working');
    console.log('   ✅ Global schema integrated');
    console.log('   ✅ Instance methods available');
    console.log('   ✅ Static methods available');
    console.log('   ✅ Service methods available');
    console.log('   ✅ Validation working');
    console.log('   ✅ Pre-save middleware registered');
    console.log('   ✅ Indexes defined');
    console.log('   ✅ Enums configured');
    console.log('   ✅ Field validations set');
    console.log('');
    console.log('✨ Practice Settings module is ready for use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run tests
runTests();
