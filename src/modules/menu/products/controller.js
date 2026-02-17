import productService from './service.js';
import { apiError } from '../../../utils/apiErrorHandler.js';
import { MESSAGES } from '../../../constants/index.js';

class ProductController {
  /**
   * Create a new product
   */
  async createProduct(req, res, next) {
    try {
      const { userId, ...productData } = req.body;
      const product = await productService.createProduct(productData, userId);

      return res.status(201).json({
        isSuccess: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get products with unified endpoint
   * Supports: get by ID, slug, category, filters, pagination
   */
  async getProducts(req, res, next) {
    try {
      const {
        tenantId,
        id,
        slug,
        categoryId,
        subcategoryId,
        productType,
        channel,
        isActive,
        isFeatured,
        tags,
        search,
        page,
        limit,
        sort
      } = req.query;

      // Get by ID
      if (id) {
        const product = await productService.getProductById(id, tenantId);
        return res.status(200).json({
          isSuccess: true,
          data: product
        });
      }

      // Get by slug
      if (slug) {
        const product = await productService.getProductBySlug(tenantId, slug);
        return res.status(200).json({
          isSuccess: true,
          data: product
        });
      }

      // Get featured products
      if (isFeatured === true || isFeatured === 'true') {
        const products = await productService.getFeaturedProducts(tenantId, limit || 10);
        return res.status(200).json({
          isSuccess: true,
          data: products,
          total: products.length
        });
      }

      // Get by category
      if (categoryId) {
        const products = await productService.getProductsByCategory(
          tenantId,
          categoryId,
          isActive
        );
        return res.status(200).json({
          isSuccess: true,
          data: products,
          total: products.length
        });
      }

      // Get by subcategory
      if (subcategoryId) {
        const products = await productService.getProductsBySubcategory(
          tenantId,
          subcategoryId,
          isActive
        );
        return res.status(200).json({
          isSuccess: true,
          data: products,
          total: products.length
        });
      }

      // Get by channel
      if (channel) {
        const products = await productService.getProductsByChannel(
          tenantId,
          channel,
          isActive
        );
        return res.status(200).json({
          isSuccess: true,
          data: products,
          total: products.length
        });
      }

      // Get by tags
      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        const products = await productService.getProductsByTags(
          tenantId,
          tagsArray,
          isActive
        );
        return res.status(200).json({
          isSuccess: true,
          data: products,
          total: products.length
        });
      }

      // Search products
      if (search) {
        const products = await productService.searchProducts(tenantId, search, isActive);
        return res.status(200).json({
          isSuccess: true,
          data: products,
          total: products.length
        });
      }

      // Build filters
      const filters = { tenantId };
      if (isActive !== undefined) filters.isActive = isActive;
      if (productType) filters.productType = productType;

      // Build options
      const options = {
        populate: ['categoryId', 'subcategoryId'],
        sort: sort || 'sortOrder'
      };

      // Get with pagination
      if (page && limit) {
        const result = await productService.getProductsWithPagination(
          filters,
          parseInt(page),
          parseInt(limit),
          options,
          tenantId
        );
        return res.status(200).json({
          isSuccess: true,
          ...result
        });
      }

      // Get all
      const products = await productService.getAllProducts(filters, options, tenantId);
      return res.status(200).json({
        isSuccess: true,
        data: products,
        total: products.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID (traditional REST endpoint)
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;

      const product = await productService.getProductById(id, tenantId);

      return res.status(200).json({
        isSuccess: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update product
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, tenantId, ...updateData } = req.body;

      const product = await productService.updateProduct(id, updateData, userId, tenantId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;

      await productService.deleteProduct(id, tenantId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
