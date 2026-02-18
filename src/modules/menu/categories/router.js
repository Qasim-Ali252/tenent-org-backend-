import express from 'express';
import categoryController from './controller.js';
import isAuthorized from '../../../middleware/auth.js';
import { validate } from '../../../validation/index.js';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
  deleteCategorySchema
} from './validation.js';

const router = express.Router();

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Protected
 */
router.post(
  '/',
  isAuthorized,
  validate(createCategorySchema),
  categoryController.createCategory
);

/**
 * @route   GET /api/v1/categories
 * @desc    Get categories (unified endpoint with query parameters)
 * @query   tenantId, id, slug, parentCategoryId, stationType, channel, isActive, isParent, search, page, limit, sort
 * @access  Protected
 */
router.get(
  '/',
  isAuthorized,
  validate(getCategoriesQuerySchema, 'query'),
  categoryController.getCategories
);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID (traditional REST style)
 * @access  Protected
 */
router.get(
  '/:id',
  isAuthorized,
  categoryController.getCategoryById
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Protected
 */
router.put(
  '/:id',
  isAuthorized,
  validate(updateCategorySchema),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (soft delete)
 * @access  Protected
 */
router.delete(
  '/:id',
  isAuthorized,
  validate(deleteCategorySchema, 'query'),
  categoryController.deleteCategory
);

export default router;
