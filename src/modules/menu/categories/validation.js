import Joi from 'joi';

// Station types enum
const STATION_TYPES = ['FRYER', 'GRILL', 'BAKERY', 'COLD', 'ASSEMBLY', 'BEVERAGE', 'OTHER'];

// Create category validation
export const createCategorySchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  name: Joi.string().max(100).required(),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/),
  description: Joi.string().max(500).allow('', null),
  parentCategoryId: Joi.string().hex().length(24).allow(null),
  imageUrl: Joi.string().uri().allow('', null),
  sortOrder: Joi.number().min(0).default(0),
  stationType: Joi.string().valid(...STATION_TYPES).default('OTHER'),
  isActive: Joi.boolean().default(true),
  showOnPOS: Joi.boolean().default(true),
  showOnWeb: Joi.boolean().default(true),
  showOnApp: Joi.boolean().default(true),
  userId: Joi.string().hex().length(24).required()
});

// Update category validation
export const updateCategorySchema = Joi.object({
  name: Joi.string().max(100),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/),
  description: Joi.string().max(500).allow('', null),
  parentCategoryId: Joi.string().hex().length(24).allow(null),
  imageUrl: Joi.string().uri().allow('', null),
  sortOrder: Joi.number().min(0),
  stationType: Joi.string().valid(...STATION_TYPES),
  isActive: Joi.boolean(),
  showOnPOS: Joi.boolean(),
  showOnWeb: Joi.boolean(),
  showOnApp: Joi.boolean(),
  userId: Joi.string().hex().length(24).required()
}).min(2); // At least userId + one field to update

// Get category by ID validation
export const getCategoryByIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
  tenantId: Joi.string().hex().length(24).required()
});

// Get categories query validation
export const getCategoriesQuerySchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  id: Joi.string().hex().length(24),
  slug: Joi.string().lowercase(),
  parentCategoryId: Joi.string().hex().length(24).allow(null),
  stationType: Joi.string().valid(...STATION_TYPES),
  channel: Joi.string().valid('POS', 'WEB', 'APP'),
  isActive: Joi.boolean(),
  isParent: Joi.boolean(), // true = only parent categories, false = only subcategories
  search: Joi.string().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('name', '-name', 'sortOrder', '-sortOrder', 'createdAt', '-createdAt')
});

// Delete category validation
export const deleteCategorySchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
  tenantId: Joi.string().hex().length(24).required()
});

export default {
  createCategorySchema,
  updateCategorySchema,
  getCategoryByIdSchema,
  getCategoriesQuerySchema,
  deleteCategorySchema
};
