import mongoose from 'mongoose';
import {
  tenantIdField,
  nameField,
  descriptionField,
  displayOrderField,
  isActiveField,
  priceField,
  createOptionalReferenceField,
  schemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Addon option subdocument schema
const addonOptionSchema = new Schema({
  name: nameField(100, 'Addon option name'),
  price: {
    ...priceField,
    required: [true, 'Price is required']
  },
  inventoryItemId: createOptionalReferenceField('InventoryItem'),
  isActive: isActiveField,
  displayOrder: displayOrderField
}, { _id: true });

// Addon Group schema (Reusable addon collections)
const addonGroupSchema = new Schema({
  tenantId: tenantIdField,
  name: nameField(100, 'Addon group name'),
  description: descriptionField(500),
  options: {
    type: [addonOptionSchema],
    validate: {
      validator: function(options) {
        return options && options.length > 0;
      },
      message: 'Addon group must have at least one option'
    }
  },
  minSelection: {
    type: Number,
    default: 0,
    min: [0, 'Minimum selection cannot be negative']
  },
  maxSelection: {
    type: Number,
    default: 10,
    min: [1, 'Maximum selection must be at least 1']
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  displayOrder: displayOrderField,
  isActive: isActiveField
}, schemaOptions);

// Indexes
addonGroupSchema.index({ tenantId: 1, name: 1 });
addonGroupSchema.index({ tenantId: 1, isActive: 1 });

// Virtual for active options count
addonGroupSchema.virtual('activeOptionsCount').get(function() {
  return this.options.filter(opt => opt.isActive).length;
});

// Instance method to get active options
addonGroupSchema.methods.getActiveOptions = function() {
  return this.options
    .filter(opt => opt.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

// Instance method to add option
addonGroupSchema.methods.addOption = async function(optionData) {
  this.options.push(optionData);
  await this.save();
  return this;
};

// Instance method to update option
addonGroupSchema.methods.updateOption = async function(optionId, optionData) {
  const option = this.options.id(optionId);
  if (!option) {
    throw new Error('Option not found');
  }
  Object.assign(option, optionData);
  await this.save();
  return this;
};

// Instance method to remove option
addonGroupSchema.methods.removeOption = async function(optionId) {
  this.options.pull(optionId);
  await this.save();
  return this;
};

// Static method to find addon groups by tenant
addonGroupSchema.statics.findByTenant = function(tenantId, isActive = true) {
  const query = { tenantId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Pre-save middleware to validate min/max selection
addonGroupSchema.pre('save', function(next) {
  if (this.minSelection > this.maxSelection) {
    return next(new Error('Minimum selection cannot be greater than maximum selection'));
  }
  
  // If required, minSelection must be at least 1
  if (this.isRequired && this.minSelection === 0) {
    this.minSelection = 1;
  }
  
  next();
});

// Pre-save middleware to validate active options
addonGroupSchema.pre('save', function(next) {
  const activeOptions = this.options.filter(opt => opt.isActive);
  
  if (activeOptions.length === 0) {
    return next(new Error('Addon group must have at least one active option'));
  }
  
  if (this.maxSelection > activeOptions.length) {
    this.maxSelection = activeOptions.length;
  }
  
  next();
});

export const AddonGroupModel = mongoose.model('AddonGroup', addonGroupSchema);

export default AddonGroupModel;
