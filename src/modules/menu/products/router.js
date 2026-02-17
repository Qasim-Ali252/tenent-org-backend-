import express from 'express';
import productController from './controller.js';
import { isAuthorized } from '../../../middleware/auth.js';
import { validate } from '../../../validation/index.js';
import {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
  deleteProductSchema
} from './validation.js';

const router = express.Router();

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  Protected
 */
router.post(
  '/',
  isAuthorized,
  validate(createProductSchema),
  productController.createProduct
);

/**
 * @route   GET /api/v1/products
 * @desc    Get products (unified endpoint with query parameters)
 * @query   tenantId, id, slug, categoryId, subcategoryId, productType, channel, isActive, isFeatured, tags, search, page, limit, sort
 * @access  Protected
 */
router.get(
  '/',
  isAuthorized,
  validate(getProductsQuerySchema, 'query'),
  productController.getProducts
);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID (traditional REST style)
 * @access  Protected
 */
router.get(
  '/:id',
  isAuthorized,
  productController.getProductById
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Protected
 */
router.put(
  '/:id',
  isAuthorized,
  validate(updateProductSchema),
  productController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product (soft delete)
 * @access  Protected
 */
router.delete(
  '/:id',
  isAuthorized,
  validate(deleteProductSchema, 'query'),
  productController.deleteProduct
);

export default router;
