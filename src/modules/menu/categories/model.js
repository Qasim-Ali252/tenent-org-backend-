import mongoose from 'mongoose';
import globalSchema from '../../../utils/globalSchema.js';
import {
  tenantIdField,
  nameField,
  slugField,
  descriptionField,
  createOptionalReferenceField,
  imageUrlField,
  sortOrderField,
  visibilityFields,
  schemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Category schema
const categorySchema = new Schema({
  tenantId: tenantIdField,
  name: nameField(100, 'Category name'),
  slug: slugField,
  description: descriptionField(500),
  parentCategoryId: createOptionalReferenceField('Category'),
  imageUrl: imageUrlField,
  sortOrder: sortOrderField,
  stationType: {
    type: String,
    enum: ['FRYER', 'GRILL', 'BAKERY', 'COLD', 'ASSEMBLY', 'BEVERAGE', 'OTHER'],
    default: 'OTHER'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ...visibilityFields
  // status, addedUser, modifiedUser, and display dates come from globalSchema
}, schemaOptions);

// Add global schema fields
categorySchema.add(globalSchema);

// Compound indexes
categorySchema.index({ tenantId: 1, slug: 1 }, { unique: true });
categorySchema.index({ tenantId: 1, parentCategoryId: 1 });
categorySchema.index({ tenantId: 1, isActive: 1 });
categorySchema.index({ tenantId: 1, sortOrder: 1 });
categorySchema.index({ tenantId: 1, stationType: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategoryId'
});

// Virtual for products count
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

// Instance method to check if category is a parent
categorySchema.methods.isParentCategory = function() {
  return this.parentCategoryId === null;
};

// Instance method to check if category is a subcategory
categorySchema.methods.isSubcategory = function() {
  return this.parentCategoryId !== null;
};

// Static method to find categories by tenant
categorySchema.statics.findByTenant = function(tenantId, isActive = true) {
  const query = { tenantId, parentCategoryId: null };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('subcategories')
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to find parent categories only
categorySchema.statics.findParentCategories = function(tenantId, isActive = true) {
  const query = { tenantId, parentCategoryId: null };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query).sort({ sortOrder: 1, name: 1 });
};

// Static method to find subcategories
categorySchema.statics.findSubcategories = function(tenantId, parentCategoryId, isActive = true) {
  const query = { tenantId, parentCategoryId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query).sort({ sortOrder: 1, name: 1 });
};

// Static method to find category by slug
categorySchema.statics.findBySlug = function(tenantId, slug) {
  return this.findOne({ 
    tenantId, 
    slug: slug.toLowerCase(),
    isActive: true
  }).populate('subcategories');
};

// Static method to find categories by station type
categorySchema.statics.findByStationType = function(tenantId, stationType, isActive = true) {
  const query = { tenantId, stationType };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query).sort({ sortOrder: 1, name: 1 });
};

// Static method to find categories visible on specific channel
categorySchema.statics.findByChannel = function(tenantId, channel, isActive = true) {
  const channelMap = {
    'POS': 'showOnPOS',
    'WEB': 'showOnWeb',
    'APP': 'showOnApp'
  };
  
  const query = { tenantId };
  if (isActive !== null) query.isActive = isActive;
  if (channelMap[channel]) query[channelMap[channel]] = true;
  
  return this.find(query)
    .populate('subcategories')
    .sort({ sortOrder: 1, name: 1 });
};

// Pre-save middleware to validate slug uniqueness per tenant
categorySchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const existingCategory = await this.constructor.findOne({
      tenantId: this.tenantId,
      slug: this.slug,
      _id: { $ne: this._id }
    });
    
    if (existingCategory) {
      return next(new Error('Category slug already exists for this tenant'));
    }
  }
  next();
});

// Pre-save middleware to prevent circular parent-child relationships
categorySchema.pre('save', async function(next) {
  if (this.isModified('parentCategoryId') && this.parentCategoryId) {
    // Check if parent is trying to be set to itself
    if (this.parentCategoryId.toString() === this._id.toString()) {
      return next(new Error('Category cannot be its own parent'));
    }
    
    // Check if parent exists
    const parent = await this.constructor.findById(this.parentCategoryId);
    if (!parent) {
      return next(new Error('Parent category not found'));
    }
    
    // Check if parent is already a subcategory (only 2 levels allowed)
    if (parent.parentCategoryId) {
      return next(new Error('Cannot create more than 2 levels of categories'));
    }
  }
  next();
});

export const CategoryModel = mongoose.model('Category', categorySchema);

export default CategoryModel;
