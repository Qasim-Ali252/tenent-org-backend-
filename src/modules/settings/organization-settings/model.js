import mongoose from 'mongoose';
import globalSchema from '../../../utils/globalSchema.js';

/**
 * OrganizationSettings Schema
 * Stores organization configuration and business settings
 * One settings record per tenant
 */
const organizationSettingsSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  
  // ==================== Basic Information ====================
  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    minlength: [2, 'Organization name must be at least 2 characters'],
    maxlength: [200, 'Organization name cannot exceed 200 characters']
  },
  
  logo: {
    type: String,  // URL or base64 string
    default: null
  },
  
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: {
      values: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'PKR', 'AED', 'SAR'],
      message: '{VALUE} is not a supported currency'
    },
    default: 'USD'
  },
  
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    enum: {
      values: ['EST', 'CST', 'PST', 'MST', 'IST', 'GMT', 'CET', 'JST', 'AEST'],
      message: '{VALUE} is not a supported timezone'
    },
    default: 'EST'
  },
  
  locale: {
    type: String,
    required: [true, 'Locale is required'],
    enum: {
      values: ['en-US', 'en-GB', 'en-IN', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA'],
      message: '{VALUE} is not a supported locale'
    },
    default: 'en-US'
  },
  
  // ==================== Subscription Details ====================
  planName: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  
  startDate: {
    type: Date,
    required: [true, 'Subscription start date is required']
  },
  
  endDate: {
    type: Date,
    required: [true, 'Subscription end date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  
  billingCycle: {
    type: String,
    required: [true, 'Billing cycle is required'],
    enum: {
      values: ['monthly', 'quarterly', 'yearly'],
      message: '{VALUE} is not a valid billing cycle'
    },
    default: 'monthly'
  },
  
  // ==================== Business Settings ====================
  defaultTaxPercentage: {
    type: Number,
    required: [true, 'Default tax percentage is required'],
    min: [0, 'Tax percentage cannot be negative'],
    max: [100, 'Tax percentage cannot exceed 100'],
    default: 0
  },
  
  serviceChargePercentage: {
    type: Number,
    required: [true, 'Service charge percentage is required'],
    min: [0, 'Service charge cannot be negative'],
    max: [100, 'Service charge cannot exceed 100'],
    default: 0
  },
  
  minimumOrderValue: {
    type: Number,
    required: [true, 'Minimum order value is required'],
    min: [0, 'Minimum order value cannot be negative'],
    default: 0
  },
  
  baseDeliveryCharges: {
    type: Number,
    required: [true, 'Base delivery charges is required'],
    min: [0, 'Delivery charges cannot be negative'],
    default: 0
  },
  
  // ==================== Legacy/Optional Fields ====================
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  
  phoneNumber: {
    type: String,
    trim: true
  },
  
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add global schema (audit trail, display dates, status)
organizationSettingsSchema.add(globalSchema);

// ==================== Indexes ====================
// Ensure one settings record per tenant
organizationSettingsSchema.index({ tenantId: 1 }, { unique: true });

// Index for status queries
organizationSettingsSchema.index({ status: 1 });

// Compound index for tenant + status
organizationSettingsSchema.index({ tenantId: 1, status: 1 });

// ==================== Instance Methods ====================

/**
 * Check if subscription is active
 */
organizationSettingsSchema.methods.isSubscriptionActive = function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.status === 'ACTIVE';
};

/**
 * Get days until subscription expires
 */
organizationSettingsSchema.methods.getDaysUntilExpiry = function() {
  const now = new Date();
  const diffTime = this.endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate total charges for an order
 */
organizationSettingsSchema.methods.calculateOrderCharges = function(subtotal, includeDelivery = false) {
  const tax = (subtotal * this.defaultTaxPercentage) / 100;
  const serviceCharge = (subtotal * this.serviceChargePercentage) / 100;
  const delivery = includeDelivery ? this.baseDeliveryCharges : 0;
  
  return {
    subtotal,
    tax,
    serviceCharge,
    delivery,
    total: subtotal + tax + serviceCharge + delivery
  };
};

/**
 * Check if order meets minimum value
 */
organizationSettingsSchema.methods.meetsMinimumOrder = function(orderValue) {
  return orderValue >= this.minimumOrderValue;
};

// ==================== Static Methods ====================

/**
 * Find settings by tenant ID
 */
organizationSettingsSchema.statics.findByTenant = async function(tenantId) {
  return await this.findOne({ tenantId, status: 'ACTIVE' });
};

/**
 * Check if settings exist for tenant
 */
organizationSettingsSchema.statics.existsForTenant = async function(tenantId) {
  const count = await this.countDocuments({ tenantId });
  return count > 0;
};

// ==================== Pre-save Middleware ====================

organizationSettingsSchema.pre('save', function(next) {
  // Ensure dates are valid
  if (this.isModified('startDate') || this.isModified('endDate')) {
    if (this.endDate <= this.startDate) {
      next(new Error('End date must be after start date'));
      return;
    }
  }
  
  // Round percentages to 2 decimal places
  if (this.isModified('defaultTaxPercentage')) {
    this.defaultTaxPercentage = Math.round(this.defaultTaxPercentage * 100) / 100;
  }
  if (this.isModified('serviceChargePercentage')) {
    this.serviceChargePercentage = Math.round(this.serviceChargePercentage * 100) / 100;
  }
  
  // Round monetary values to 2 decimal places
  if (this.isModified('minimumOrderValue')) {
    this.minimumOrderValue = Math.round(this.minimumOrderValue * 100) / 100;
  }
  if (this.isModified('baseDeliveryCharges')) {
    this.baseDeliveryCharges = Math.round(this.baseDeliveryCharges * 100) / 100;
  }
  
  next();
});

const OrganizationSettingsModel = mongoose.model('OrganizationSetting', organizationSettingsSchema);

export default OrganizationSettingsModel;
