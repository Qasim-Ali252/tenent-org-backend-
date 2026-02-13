import mongoose from 'mongoose';
import {
  tenantIdField,
  createReferenceField,
  createOptionalReferenceField,
  nameField,
  priceField,
  costPriceField,
  requiredSkuField,
  preparationTimeField,
  nutritionSchema,
  displayOrderField,
  isActiveField,
  schemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Variant Option schema (Actual sellable SKUs)
const variantOptionSchema = new Schema({
  tenantId: tenantIdField,
  productId: createReferenceField('Product', 'Product ID'),
  variantGroupId: createReferenceField('VariantGroup', 'Variant group ID'),
  name: nameField(100, 'Variant option name'),
  price: {
    ...priceField,
    required: [true, 'Price is required']
  },
  costPrice: costPriceField,
  sku: requiredSkuField,
  inventoryItemId: createOptionalReferenceField('InventoryItem'),
  preparationTime: {
    ...preparationTimeField,
    default: null
  },
  servings: {
    type: String,
    trim: true,
    maxlength: [50, 'Servings cannot exceed 50 characters']
  },
  nutrition: {
    type: nutritionSchema,
    default: () => ({})
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: isActiveField,
  displayOrder: displayOrderField
}, schemaOptions);

// Compound indexes
variantOptionSchema.index({ tenantId: 1, productId: 1 });
variantOptionSchema.index({ tenantId: 1, variantGroupId: 1 });
variantOptionSchema.index({ tenantId: 1, isActive: 1 });
variantOptionSchema.index({ sku: 1 }, { unique: true });
variantOptionSchema.index({ productId: 1, variantGroupId: 1, displayOrder: 1 });

// Virtual for profit margin
variantOptionSchema.virtual('profitMargin').get(function() {
  if (!this.costPrice || this.costPrice === 0) return null;
  return ((this.price - this.costPrice) / this.price * 100).toFixed(2);
});

// Virtual for profit amount
variantOptionSchema.virtual('profitAmount').get(function() {
  if (!this.costPrice) return null;
  return this.price - this.costPrice;
});

// Static method to find variant options by product
variantOptionSchema.statics.findByProduct = function(tenantId, productId, isActive = true) {
  const query = { tenantId, productId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('variantGroupId')
    .sort({ displayOrder: 1, name: 1 });
};

// Static method to find variant options by variant group
variantOptionSchema.statics.findByVariantGroup = function(tenantId, variantGroupId, isActive = true) {
  const query = { tenantId, variantGroupId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Static method to find variant option by SKU
variantOptionSchema.statics.findBySKU = function(sku) {
  return this.findOne({ 
    sku: sku.toUpperCase(),
    isActive: true
  })
  .populate('productId variantGroupId');
};

// Static method to find default variant for a product
variantOptionSchema.statics.findDefaultVariant = function(tenantId, productId) {
  return this.findOne({ 
    tenantId,
    productId,
    isDefault: true,
    isActive: true
  }).populate('variantGroupId');
};

// Pre-save middleware to validate SKU uniqueness
variantOptionSchema.pre('save', async function(next) {
  if (this.isModified('sku')) {
    const existingVariant = await this.constructor.findOne({
      sku: this.sku.toUpperCase(),
      _id: { $ne: this._id }
    });
    
    if (existingVariant) {
      return next(new Error('SKU already exists'));
    }
  }
  next();
});

// Pre-save middleware to ensure only one default per variant group
variantOptionSchema.pre('save', async function(next) {
  if (this.isModified('isDefault') && this.isDefault) {
    // Remove default from other options in the same variant group
    await this.constructor.updateMany(
      {
        variantGroupId: this.variantGroupId,
        _id: { $ne: this._id }
      },
      { isDefault: false }
    );
  }
  next();
});

export const VariantOptionModel = mongoose.model('VariantOption', variantOptionSchema);

export default VariantOptionModel;
