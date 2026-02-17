import GlobalService from '../../../utils/globalService.js';
import ProductModel from './model.js';
import { apiError } from '../../../utils/apiErrorHandler.js';
import { MESSAGES } from '../../../constants/index.js';

class ProductService extends GlobalService {
  constructor() {
    super(ProductModel);
  }

  /**
   * Create a new product
   * @param {Object} data - Product data
   * @param {String} userId - User ID creating the product
   * @returns {Promise<Object>} Created product
   */
  async createProduct(data, userId) {
    try {
      // Set audit fields
      data.addedUser = userId;
      data.modifiedUser = userId;

      // Auto-generate slug if not provided
      if (!data.slug && data.name) {
        data.slug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      const product = await this.create(data, {
        populate: ['categoryId', 'subcategoryId', 'variantGroupIds']
      });

      return product;
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.CREATE_FAILED);
    }
  }

  /**
   * Get product by ID
   * @param {String} id - Product ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Product
   */
  async getProductById(id, tenantId) {
    try {
      const product = await this.getById(
        id,
        {
          populate: ['categoryId', 'subcategoryId', 'variantGroupIds', 'variants', 'addons']
        },
        tenantId
      );

      if (!product) {
        throw apiError.notFound('Product not found');
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all products with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Array>} Products
   */
  async getAllProducts(filters, options, tenantId) {
    try {
      return await this.getAll(filters, options, tenantId);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get products with pagination
   * @param {Object} filters - Query filters
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {Object} options - Query options
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Paginated products
   */
  async getProductsWithPagination(filters, page, limit, options, tenantId) {
    try {
      return await this.getAllWithPagination(filters, page, limit, options, tenantId);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Update product
   * @param {String} id - Product ID
   * @param {Object} updateData - Update data
   * @param {String} userId - User ID updating the product
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(id, updateData, userId, tenantId) {
    try {
      // Set modified user
      updateData.modifiedUser = userId;

      const product = await this.update(
        id,
        updateData,
        {
          populate: ['categoryId', 'subcategoryId', 'variantGroupIds']
        },
        tenantId
      );

      return product;
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.UPDATE_FAILED);
    }
  }

  /**
   * Delete product (soft delete)
   * @param {String} id - Product ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Number>} Deleted count
   */
  async deleteProduct(id, tenantId) {
    try {
      return await this.deleteOne(id, tenantId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get products by category
   * @param {String} tenantId - Tenant ID
   * @param {String} categoryId - Category ID
   * @param {Boolean} isActive - Filter by active status
   * @returns {Promise<Array>} Products
   */
  async getProductsByCategory(tenantId, categoryId, isActive = true) {
    try {
      return await ProductModel.findByCategory(tenantId, categoryId, isActive);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get products by subcategory
   * @param {String} tenantId - Tenant ID
   * @param {String} subcategoryId - Subcategory ID
   * @param {Boolean} isActive - Filter by active status
   * @returns {Promise<Array>} Products
   */
  async getProductsBySubcategory(tenantId, subcategoryId, isActive = true) {
    try {
      return await ProductModel.findBySubcategory(tenantId, subcategoryId, isActive);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get product by slug
   * @param {String} tenantId - Tenant ID
   * @param {String} slug - Product slug
   * @returns {Promise<Object>} Product
   */
  async getProductBySlug(tenantId, slug) {
    try {
      const product = await ProductModel.findBySlug(tenantId, slug);
      
      if (!product) {
        throw apiError.notFound('Product not found');
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get featured products
   * @param {String} tenantId - Tenant ID
   * @param {Number} limit - Limit
   * @returns {Promise<Array>} Featured products
   */
  async getFeaturedProducts(tenantId, limit = 10) {
    try {
      return await ProductModel.findFeatured(tenantId, limit);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get products by tags
   * @param {String} tenantId - Tenant ID
   * @param {Array} tags - Tags array
   * @param {Boolean} isActive - Filter by active status
   * @returns {Promise<Array>} Products
   */
  async getProductsByTags(tenantId, tags, isActive = true) {
    try {
      return await ProductModel.findByTags(tenantId, tags, isActive);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Search products
   * @param {String} tenantId - Tenant ID
   * @param {String} searchTerm - Search term
   * @param {Boolean} isActive - Filter by active status
   * @returns {Promise<Array>} Products
   */
  async searchProducts(tenantId, searchTerm, isActive = true) {
    try {
      return await ProductModel.search(tenantId, searchTerm, isActive);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get products by channel
   * @param {String} tenantId - Tenant ID
   * @param {String} channel - Channel (POS, WEB, MOBILE)
   * @param {Boolean} isActive - Filter by active status
   * @returns {Promise<Array>} Products
   */
  async getProductsByChannel(tenantId, channel, isActive = true) {
    try {
      return await ProductModel.findByChannel(tenantId, channel, isActive);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }
}

export default new ProductService();
