import mongoose from 'mongoose';
import globalSchema from '../../utils/globalSchema.js';
import { 
  slugField, 
  schemaOptions 
} from '../../utils/commonFields.js';

const { Schema } = mongoose;

// Domain subdocument schema
const domainSchema = new Schema({
  domain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  purpose: {
    type: String,
    enum: ['BRAND_WEBSITE', 'ONLINE_ORDERING', 'ADMIN_PANEL'],
    required: true
  },
  sslStatus: {
    type: String,
    enum: ['ACTIVE', 'PENDING', 'EXPIRED'],
    default: 'PENDING'
  }
}, { _id: true });

// Branding subdocument schema
const brandingSchema = new Schema({
  logoUrl: {
    type: String,
    default: null
  },
  faviconUrl: {
    type: String,
    default: null
  },
  colors: {
    primary: {
      type: String,
      default: '#000000'
    },
    secondary: {
      type: String,
      default: '#ffffff'
    },
    accent: {
      type: String,
      default: '#0066cc'
    }
  },
  fontFamily: {
    type: String,
    default: 'Inter'
  }
}, { _id: false });

// Localisation subdocument schema
const localisationSchema = new Schema({
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    maxlength: 3
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  locale: {
    type: String,
    default: 'en-US'
  }
}, { _id: false });

// Subscription subdocument schema
const subscriptionSchema = new Schema({
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL'],
    default: 'MONTHLY'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL'],
    default: 'TRIAL'
  }
}, { _id: false });

// Business settings subdocument schema
const businessSettingsSchema = new Schema({
  defaultTaxPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  serviceChargePercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  minimumOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  baseDeliveryCharge: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// Offline support subdocument schema
const offlineSupportSchema = new Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  posSyncIntervalSeconds: {
    type: Number,
    default: 60,
    min: 10
  },
  conflictStrategy: {
    type: String,
    enum: ['SERVER_WINS', 'CLIENT_WINS', 'MANUAL_RESOLVE'],
    default: 'SERVER_WINS'
  }
}, { _id: false });

// Main Tenant schema
const tenantSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true,
    maxlength: [100, 'Tenant name cannot exceed 100 characters']
  },
  legalName: {
    type: String,
    required: [true, 'Legal name is required'],
    trim: true,
    maxlength: [200, 'Legal name cannot exceed 200 characters']
  },
  slug: slugField,
  domains: {
    type: [domainSchema],
    validate: {
      validator: function(domains) {
        // Ensure at least one domain exists
        if (domains.length === 0) return false;
        
        // Ensure only one default domain
        const defaultDomains = domains.filter(d => d.isDefault);
        return defaultDomains.length === 1;
      },
      message: 'Must have at least one domain and exactly one default domain'
    }
  },
  branding: {
    type: brandingSchema,
    default: () => ({})
  },
  localisation: {
    type: localisationSchema,
    default: () => ({})
  },
  subscription: {
    type: subscriptionSchema,
    required: true
  },
  businessSettings: {
    type: businessSettingsSchema,
    default: () => ({})
  },
  offlineSupport: {
    type: offlineSupportSchema,
    default: () => ({})
  }
  // status, addedUser, modifiedUser, and display dates come from globalSchema
}, schemaOptions);

// Add global schema fields
tenantSchema.add(globalSchema);

// Indexes for performance
tenantSchema.index({ slug: 1 });
tenantSchema.index({ 'domains.domain': 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'subscription.planId': 1 });
tenantSchema.index({ createdAt: -1 });

// Virtual for default domain
tenantSchema.virtual('defaultDomain').get(function() {
  return this.domains.find(d => d.isDefault)?.domain || null;
});

// Instance method to check if subscription is active
tenantSchema.methods.isSubscriptionActive = function() {
  if (this.subscription.status !== 'ACTIVE') return false;
  return new Date() <= this.subscription.endDate;
};

// Instance method to check if tenant can access a module
tenantSchema.methods.hasModuleAccess = async function(moduleKey) {
  // For now, just return true since we don't have PlanModule model yet
  // TODO: Implement proper module access check with PlanModule
  return true;
};

// Static method to find tenant by domain
tenantSchema.statics.findByDomain = function(domain) {
  return this.findOne({
    'domains.domain': domain.toLowerCase(),
    status: 'ACTIVE'
  });
};

// Static method to find active tenants
tenantSchema.statics.findActive = function() {
  return this.find({ status: 'ACTIVE' });
};

// Pre-save middleware to ensure slug uniqueness
tenantSchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const existingTenant = await this.constructor.findOne({ 
      slug: this.slug,
      _id: { $ne: this._id }
    });
    
    if (existingTenant) {
      throw new Error('Slug already exists');
    }
  }
  next();
});

export const TenantModel = mongoose.model('Tenant', tenantSchema);

export default TenantModel;
