import Joi from 'joi';

// Product types
const PRODUCT_TYPES = ['SIMPLE', 'VARIABLE'];
const ALLERGENS = ['GLUTEN', 'DAIRY', 'EGGS', 'NUTS', 'PEANUTS', 'SOY', 'FISH', 'SHELLFISH', 'SESAME'];
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

// Availability schedule schema
const availabilityScheduleSchema = Joi.object({
  day: Joi.string().valid(...DAYS).required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
});

// Images schema
const imagesSchema = Joi.object({
  main: Joi.string().uri().required(),
  gallery: Joi.array().items(Joi.string().uri())
});

// Visibility schema
const visibilitySchema = Joi.object({
  showOnPOS: Joi.boolean().default(true),
  showOnWeb: Joi.boolean().default(true),
  showOnMobile: Joi.boolean().default(true)
});

// Create product validation
export const createProductSchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  name: Joi.string().max(200).required(),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/),
  categoryId: Joi.string().hex().length(24).required(),
  subcategoryId: Joi.string().hex().length(24).allow(null),
  description: Joi.string().max(1000).allow('', null),
  productType: Joi.string().valid(...PRODUCT_TYPES).default('SIMPLE'),
  hasVariants: Joi.boolean(),
  variantGroupIds: Joi.array().items(Joi.string().hex().length(24)),
  // For simple products
  price: Joi.number().min(0).when('productType', {
    is: 'SIMPLE',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  costPrice: Joi.number().min(0).allow(null),
  sku: Joi.string().uppercase().trim(),
  images: imagesSchema.required(),
  tags: Joi.array().items(Joi.string().lowercase().trim()),
  allergens: Joi.array().items(Joi.string().valid(...ALLERGENS).uppercase()),
  availabilitySchedule: Joi.array().items(availabilityScheduleSchema),
  visibility: visibilitySchema,
  preparationTime: Joi.number().min(0).default(15),
  calories: Joi.number().min(0).allow(null),
  isActive: Joi.boolean().default(true),
  isFeatured: Joi.boolean().default(false),
  sortOrder: Joi.number().min(0).default(0),
  userId: Joi.string().hex().length(24).required()
});

// Update product validation
export const updateProductSchema = Joi.object({
  name: Joi.string().max(200),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/),
  categoryId: Joi.string().hex().length(24),
  subcategoryId: Joi.string().hex().length(24).allow(null),
  description: Joi.string().max(1000).allow('', null),
  productType: Joi.string().valid(...PRODUCT_TYPES),
  hasVariants: Joi.boolean(),
  variantGroupIds: Joi.array().items(Joi.string().hex().length(24)),
  price: Joi.number().min(0).allow(null),
  costPrice: Joi.number().min(0).allow(null),
  sku: Joi.string().uppercase().trim(),
  images: imagesSchema,
  tags: Joi.array().items(Joi.string().lowercase().trim()),
  allergens: Joi.array().items(Joi.string().valid(...ALLERGENS).uppercase()),
  availabilitySchedule: Joi.array().items(availabilityScheduleSchema),
  visibility: visibilitySchema,
  preparationTime: Joi.number().min(0),
  calories: Joi.number().min(0).allow(null),
  isActive: Joi.boolean(),
  isFeatured: Joi.boolean(),
  sortOrder: Joi.number().min(0),
  userId: Joi.string().hex().length(24).required()
}).min(2); // At least userId + one field to update

// Get products query validation
export const getProductsQuerySchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  id: Joi.string().hex().length(24),
  slug: Joi.string().lowercase(),
  categoryId: Joi.string().hex().length(24),
  subcategoryId: Joi.string().hex().length(24),
  productType: Joi.string().valid(...PRODUCT_TYPES),
  channel: Joi.string().valid('POS', 'WEB', 'MOBILE'),
  isActive: Joi.boolean(),
  isFeatured: Joi.boolean(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ),
  search: Joi.string().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('name', '-name', 'price', '-price', 'sortOrder', '-sortOrder', 'createdAt', '-createdAt')
});

// Delete product validation
export const deleteProductSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
  tenantId: Joi.string().hex().length(24).required()
});

export default {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
  deleteProductSchema
};
