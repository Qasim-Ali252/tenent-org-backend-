import mongoose from 'mongoose';
import {
  tenantIdField,
  createReferenceField,
  nameField,
  displayOrderField,
  isActiveField,
  schemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Variant Group schema (e.g., Size, Crust, Spice Level)
const variantGroupSchema = new Schema({
  tenantId: tenantIdField,
  productId: createReferenceField('Product', 'Product ID'),
  name: nameField(100, 'Variant group name'),
  minSelection: {
    type: Number,
    default: 1,
    min: [0, 'Minimum selection cannot be negative']
  },
  maxSelection: {
    type: Number,
    default: 1,
    min: [1, 'Maximum selection must be at least 1']
  },
  displayOrder: displayOrderField,
  isActive: isActiveField
}, schemaOptions);

// Compound indexes
variantGroupSchema.index({ tenantId: 1, productId: 1 });
variantGroupSchema.index({ tenantId: 1, isActive: 1 });
variantGroupSchema.index({ productId: 1, displayOrder: 1 });

// Virtual for variant options
variantGroupSchema.virtual('options', {
  ref: 'VariantOption',
  localField: '_id',
  foreignField: 'variantGroupId'
});

// Instance method to check if selection is required
variantGroupSchema.methods.isRequired = function() {
  return this.minSelection > 0;
};

// Instance method to check if multiple selections allowed
variantGroupSchema.methods.allowsMultipleSelections = function() {
  return this.maxSelection > 1;
};

// Static method to find variant groups by product
variantGroupSchema.statics.findByProduct = function(tenantId, productId, isActive = true) {
  const query = { tenantId, productId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('options')
    .sort({ displayOrder: 1, name: 1 });
};

// Pre-save middleware to validate min/max selection
variantGroupSchema.pre('save', function(next) {
  if (this.minSelection > this.maxSelection) {
    return next(new Error('Minimum selection cannot be greater than maximum selection'));
  }
  next();
});

export const VariantGroupModel = mongoose.model('VariantGroup', variantGroupSchema);

export default VariantGroupModel;
