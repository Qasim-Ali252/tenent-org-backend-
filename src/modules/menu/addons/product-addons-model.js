import mongoose from 'mongoose';
import {
  tenantIdField,
  createReferenceField,
  createOptionalReferenceField,
  displayOrderField,
  isActiveField,
  basicSchemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Product Addons schema (Links products to addon groups)
const productAddonSchema = new Schema({
  tenantId: tenantIdField,
  productId: createReferenceField('Product', 'Product ID'),
  variantId: createOptionalReferenceField('VariantOption'),
  addonGroupId: createReferenceField('AddonGroup', 'Addon group ID'),
  displayOrder: displayOrderField,
  isActive: isActiveField
}, basicSchemaOptions);

// Compound indexes
productAddonSchema.index({ tenantId: 1, productId: 1, addonGroupId: 1 }, { unique: true });
productAddonSchema.index({ tenantId: 1, productId: 1, displayOrder: 1 });
productAddonSchema.index({ tenantId: 1, variantId: 1 });

// Static method to find addons by product
productAddonSchema.statics.findByProduct = function(tenantId, productId, isActive = true) {
  const query = { tenantId, productId, variantId: null };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('addonGroupId')
    .sort({ displayOrder: 1 });
};

// Static method to find addons by variant
productAddonSchema.statics.findByVariant = function(tenantId, variantId, isActive = true) {
  const query = { tenantId, variantId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('addonGroupId')
    .sort({ displayOrder: 1 });
};

// Static method to find addons by product or variant
productAddonSchema.statics.findByProductOrVariant = function(tenantId, productId, variantId = null, isActive = true) {
  const query = {
    tenantId,
    $or: [
      { productId, variantId: null },
      { variantId }
    ]
  };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('addonGroupId')
    .sort({ displayOrder: 1 });
};

// Pre-save middleware to prevent duplicate addon groups
productAddonSchema.pre('save', async function(next) {
  const existing = await this.constructor.findOne({
    tenantId: this.tenantId,
    productId: this.productId,
    variantId: this.variantId,
    addonGroupId: this.addonGroupId,
    _id: { $ne: this._id }
  });
  
  if (existing) {
    return next(new Error('This addon group is already linked to this product/variant'));
  }
  next();
});

export const ProductAddonModel = mongoose.model('ProductAddon', productAddonSchema);

export default ProductAddonModel;
