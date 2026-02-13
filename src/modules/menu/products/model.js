import mongoose from 'mongoose';
import globalSchema from '../../../utils/globalSchema.js';
import {
  tenantIdField,
  nameField,
  slugField,
  descriptionField,
  createReferenceField,
  createOptionalReferenceField,
  createArrayReferenceField,
  priceField,
  costPriceField,
  skuField,
  imagesSchema,
  tagsField,
  allergensField,
  visibilitySchema,
  preparationTimeField,
  sortOrderField,
  schemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Availability schedule subdocument schema
const availabilityScheduleSchema = new Schema({
  day: {
    type: String,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    required: true
  },
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

// Product schema
const productSchema = new Schema({
  tenantId: tenantIdField,
  name: nameField(200, 'Product name'),
  slug: slugField,
  categoryId: createReferenceField('Category', 'Category ID'),
  subcategoryId: createOptionalReferenceField('Category'),
  description: descriptionField(1000),
  productType: {
    type: String,
    enum: ['SIMPLE', 'VARIABLE'],
    default: 'SIMPLE',
    required: true
  },
  hasVariants: {
    type: Boolean,
    default: false
  },
  variantGroupIds: createArrayReferenceField('VariantGroup'),
  // For simple products (no variants)
  price: priceField,
  costPrice: costPriceField,
  sku: skuField,
  images: {
    type: imagesSchema,
    required: true
  },
  tags: tagsField,
  allergens: allergensField,
  availabilitySchedule: [availabilityScheduleSchema],
  visibility: {
    type: visibilitySchema,
    default: () => ({})
  },
  preparationTime: preparationTimeField,
  calories: {
    type: Number,
    min: [0, 'Calories cannot be negative'],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: sortOrderField
  // status, addedUser, modifiedUser, and display dates come from globalSchema
}, schemaOptions);

// Add global schema fields
productSchema.add(globalSchema);

// Compound indexes
productSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
productSchema.index({ tenantId: 1, categoryId: 1 });
productSchema.index({ tenantId: 1, subcategoryId: 1 });
productSchema.index({ tenantId: 1, isActive: 1 });
productSchema.index({ tenantId: 1, isFeatured: 1 });
productSchema.index({ tenantId: 1, tags: 1 });
productSchema.index({ sku: 1 }, { sparse: true });

// Virtual for variants
productSchema.virtual('variants', {
  ref: 'VariantOption',
  localField: '_id',
  foreignField: 'productId'
});

// Virtual for addons
productSchema.virtual('addons', {
  ref: 'ProductAddon',
  localField: '_id',
  foreignField: 'productId'
});

// Instance method to check if product is available now
productSchema.methods.isAvailableNow = function() {
  if (!this.isActive) return false;
  if (!this.availabilitySchedule || this.availabilitySchedule.length === 0) return true;

  const now = new Date();
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const todaySchedule = this.availabilitySchedule.find(s => s.day === currentDay);
  if (!todaySchedule) return false;

  return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
};

// Instance method to check if product is visible on channel
productSchema.methods.isVisibleOn = function(channel) {
  const channelMap = {
    'POS': 'showOnPOS',
    'WEB': 'showOnWeb',
    'MOBILE': 'showOnMobile'
  };
  
  return this.visibility[channelMap[channel]] === true;
};

// Static method to find products by tenant
productSchema.statics.findByTenant = function(tenantId, isActive = true) {
  const query = { tenantId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('categoryId subcategoryId')
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to find products by category
productSchema.statics.findByCategory = function(tenantId, categoryId, isActive = true) {
  const query = { tenantId, categoryId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('categoryId subcategoryId')
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to find products by subcategory
productSchema.statics.findBySubcategory = function(tenantId, subcategoryId, isActive = true) {
  const query = { tenantId, subcategoryId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('categoryId subcategoryId')
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to find product by slug
productSchema.statics.findBySlug = function(tenantId, slug) {
  return this.findOne({ 
    tenantId, 
    slug: slug.toLowerCase(),
    isActive: true
  })
  .populate('categoryId subcategoryId')
  .populate('variantGroupIds');
};

// Static method to find featured products
productSchema.statics.findFeatured = function(tenantId, limit = 10) {
  return this.find({ 
    tenantId, 
    isFeatured: true,
    isActive: true
  })
  .populate('categoryId subcategoryId')
  .sort({ sortOrder: 1 })
  .limit(limit);
};

// Static method to find products by tags
productSchema.statics.findByTags = function(tenantId, tags, isActive = true) {
  const query = { 
    tenantId,
    tags: { $in: tags.map(t => t.toLowerCase()) }
  };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('categoryId subcategoryId')
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to search products
productSchema.statics.search = function(tenantId, searchTerm, isActive = true) {
  const query = {
    tenantId,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('categoryId subcategoryId')
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to find products by channel
productSchema.statics.findByChannel = function(tenantId, channel, isActive = true) {
  const channelMap = {
    'POS': 'visibility.showOnPOS',
    'WEB': 'visibility.showOnWeb',
    'MOBILE': 'visibility.showOnMobile'
  };
  
  const query = { tenantId };
  if (isActive !== null) query.isActive = isActive;
  if (channelMap[channel]) query[channelMap[channel]] = true;
  
  return this.find(query)
    .populate('categoryId subcategoryId')
    .sort({ sortOrder: 1, name: 1 });
};

// Pre-save middleware to validate slug uniqueness per tenant
productSchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const existingProduct = await this.constructor.findOne({
      tenantId: this.tenantId,
      slug: this.slug,
      _id: { $ne: this._id }
    });
    
    if (existingProduct) {
      return next(new Error('Product slug already exists for this tenant'));
    }
  }
  next();
});

// Pre-save middleware to validate product type consistency
productSchema.pre('save', function(next) {
  if (this.productType === 'SIMPLE') {
    // Simple products must have price
    if (!this.price && this.price !== 0) {
      return next(new Error('Simple products must have a price'));
    }
    this.hasVariants = false;
    this.variantGroupIds = [];
  } else if (this.productType === 'VARIABLE') {
    // Variable products must have variants
    this.hasVariants = true;
    // Price should be null for variable products (set on variants)
    this.price = null;
    this.costPrice = null;
    this.sku = null;
  }
  next();
});

// Pre-save middleware to validate subcategory belongs to category
productSchema.pre('save', async function(next) {
  if (this.isModified('subcategoryId') && this.subcategoryId) {
    const Category = mongoose.model('Category');
    const subcategory = await Category.findById(this.subcategoryId);
    
    if (!subcategory) {
      return next(new Error('Subcategory not found'));
    }
    
    if (subcategory.parentCategoryId?.toString() !== this.categoryId.toString()) {
      return next(new Error('Subcategory does not belong to the selected category'));
    }
  }
  next();
});

export const ProductModel = mongoose.model('Product', productSchema);

export default ProductModel;
