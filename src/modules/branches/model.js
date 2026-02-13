import mongoose from 'mongoose';
import globalSchema from '../../utils/globalSchema.js';
import {
  tenantIdField,
  nameField,
  addressSchema,
  locationSchema,
  phoneNumberField,
  optionalEmailField,
  createOptionalReferenceField,
  schemaOptions
} from '../../utils/commonFields.js';

const { Schema } = mongoose;

// Opening hours break subdocument
const breakSchema = new Schema({
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  }
}, { _id: false });

// Opening hours subdocument schema
const openingHoursSchema = new Schema({
  day: {
    type: String,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String,
    required: function() { return this.isOpen; },
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  closeTime: {
    type: String,
    required: function() { return this.isOpen; },
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  breaks: {
    type: [breakSchema],
    default: []
  }
}, { _id: false });

// Capabilities subdocument schema
const capabilitiesSchema = new Schema({
  hasDineIn: {
    type: Boolean,
    default: false
  },
  hasTakeaway: {
    type: Boolean,
    default: true
  },
  hasDelivery: {
    type: Boolean,
    default: false
  },
  hasDriveThru: {
    type: Boolean,
    default: false
  },
  hasKiosk: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Capacity subdocument schema
const capacitySchema = new Schema({
  seatingCapacity: {
    type: Number,
    default: 0,
    min: [0, 'Seating capacity cannot be negative']
  },
  parkingSpots: {
    type: Number,
    default: 0,
    min: [0, 'Parking spots cannot be negative']
  },
  driveThruLanes: {
    type: Number,
    default: 0,
    min: [0, 'Drive-thru lanes cannot be negative']
  },
  maxConcurrentOrders: {
    type: Number,
    default: 10,
    min: [1, 'Must handle at least 1 concurrent order']
  }
}, { _id: false });

// Delivery settings subdocument schema
const deliverySettingsSchema = new Schema({
  deliveryRadius: {
    type: Number,
    default: 5.0,
    min: [0, 'Delivery radius cannot be negative'],
    max: [100, 'Delivery radius cannot exceed 100 km/miles']
  },
  estimatedDeliveryTime: {
    type: Number, // in minutes
    default: 30,
    min: [1, 'Delivery time must be at least 1 minute']
  },
  minimumOrderValue: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order value cannot be negative']
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: [0, 'Delivery charge cannot be negative']
  }
}, { _id: false });

// Main Branch schema
const branchSchema = new Schema({
  tenantId: tenantIdField,
  code: {
    type: String,
    required: [true, 'Branch code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Branch code cannot exceed 20 characters'],
    match: [/^[A-Z0-9-_]+$/, 'Branch code can only contain uppercase letters, numbers, hyphens, and underscores']
  },
  name: nameField(100, 'Branch name'),
  address: {
    type: addressSchema,
    required: true
  },
  location: {
    type: locationSchema,
    required: true
  },
  phone: phoneNumberField,
  email: optionalEmailField,
  managerPhone: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format']
  },
  openingHours: {
    type: [openingHoursSchema],
    validate: {
      validator: function(hours) {
        // Ensure all 7 days are present
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
        const providedDays = hours.map(h => h.day);
        return days.every(day => providedDays.includes(day));
      },
      message: 'Opening hours must include all 7 days of the week'
    }
  },
  capabilities: {
    type: capabilitiesSchema,
    default: () => ({})
  },
  capacity: {
    type: capacitySchema,
    default: () => ({})
  },
  deliverySettings: {
    type: deliverySettingsSchema,
    default: () => ({})
  },
  managerId: createOptionalReferenceField('Employee')
  // status, addedUser, modifiedUser, and display dates come from globalSchema
}, schemaOptions);

// Add global schema fields (status, audit trail, display dates)
branchSchema.add(globalSchema);

// Compound indexes for performance
branchSchema.index({ tenantId: 1, status: 1 });
branchSchema.index({ tenantId: 1, code: 1 }, { unique: true });
branchSchema.index({ location: '2dsphere' }); // Geospatial index for location-based queries
branchSchema.index({ status: 1 });
branchSchema.index({ managerId: 1 });

// Virtual for full address
branchSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
});

// Instance method to check if branch is currently open
branchSchema.methods.isCurrentlyOpen = function() {
  const now = new Date();
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const todayHours = this.openingHours.find(h => h.day === currentDay);
  
  if (!todayHours || !todayHours.isOpen) return false;
  
  // Check if current time is within opening hours
  if (currentTime < todayHours.openTime || currentTime > todayHours.closeTime) {
    return false;
  }

  // Check if current time is during a break
  for (const breakTime of todayHours.breaks) {
    if (currentTime >= breakTime.startTime && currentTime <= breakTime.endTime) {
      return false;
    }
  }

  return true;
};

// Instance method to get today's opening hours
branchSchema.methods.getTodayHours = function() {
  const now = new Date();
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const currentDay = dayNames[now.getDay()];
  return this.openingHours.find(h => h.day === currentDay);
};

// Static method to find branches by tenant
branchSchema.statics.findByTenant = function(tenantId, status = 'ACTIVE') {
  const query = { tenantId };
  if (status) query.status = status;
  return this.find(query).populate('managerId').sort({ name: 1 });
};

// Static method to find branch by code
branchSchema.statics.findByCode = function(tenantId, code) {
  return this.findOne({ 
    tenantId, 
    code: code.toUpperCase(),
    status: 'ACTIVE'
  }).populate('managerId');
};

// Static method to find nearby branches (geospatial query)
branchSchema.statics.findNearby = function(tenantId, longitude, latitude, maxDistance = 10000) {
  return this.find({
    tenantId,
    status: 'ACTIVE',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    }
  });
};

// Static method to find branches with specific capability
branchSchema.statics.findByCapability = function(tenantId, capability) {
  const query = { tenantId, status: 'ACTIVE' };
  query[`capabilities.${capability}`] = true;
  return this.find(query).sort({ name: 1 });
};

// Pre-save middleware to validate coordinates
branchSchema.pre('save', function(next) {
  if (this.isModified('location.coordinates')) {
    const [lng, lat] = this.location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return next(new Error('Invalid coordinates'));
    }
  }
  next();
});

// Pre-save middleware to ensure unique code per tenant
branchSchema.pre('save', async function(next) {
  if (this.isModified('code')) {
    const existingBranch = await this.constructor.findOne({
      tenantId: this.tenantId,
      code: this.code,
      _id: { $ne: this._id }
    });
    
    if (existingBranch) {
      return next(new Error('Branch code already exists for this tenant'));
    }
  }
  next();
});

export const BranchModel = mongoose.model('Branch', branchSchema);

export default BranchModel;
