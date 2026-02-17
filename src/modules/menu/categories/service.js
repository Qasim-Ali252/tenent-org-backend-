import GlobalService from '../../../utils/globalService.js';
import CategoryModel from './model.js';
import { apiError } from '../../../utils/apiErrorHandler.js';
import { MESSAGES } from '../../../constants/index.js';

class CategoryService extends GlobalService {
  constructor() {
    super(CategoryModel);
  }

  /**
   * Create a new category
   * @param {Object} data - Category data
   * @param {String} userId - User ID creating the category
   * @returns {Promise<Object>} Created category
   */
  async createCategory(data, userId) {
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

      const category = await this.create(data, {
        populate: 'parentCategoryId'
      });

      return category;
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.CREATE_FAILED);
    }
  }

  /**
   * Get category by ID
   * @param {String} id - Category ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Category
   */
  async getCategoryById(id, tenantId) {
    try {
      const category = await this.getById(
        id,
        {
          populate: ['parentCategoryId', 'subcategories']
        },
        tenantId
      );

      if (!category) {
        throw apiError.notFound('Category not found');
      }

      return category;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all categories with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Array>} Categories
   */
  async getAllCategories(filters, options, tenantId) {
    try {
      return await this.getAll(filters, options, tenantId);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get categories with pagination
   * @param {Object} filters - Query filters
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {Object} options - Query options
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Paginated categories
   */
  async getCategoriesWithPagination(filters, page, limit, options, tenantId) {
    try {
      return await this.getAllWithPagination(filters, page, limit, options, tenantId);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Update category
   * @param {String} id - Category ID
   * @param {Object} updateData - Update data
   * @param {String} userId - User ID updating the category
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(id, updateData, userId, tenantId) {
    try {
      // Set modified user
      updateData.modifiedUser = userId;

      const category = await this.update(
        id,
        updateData,
        {
          populate: ['parentCategoryId', 'subcategories']
        },
        tenantId
      );

      return category;
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.UPDATE_FAILED);
    }
  }

  /**
   * Delete category (soft delete)
   * @param {String} id - Category ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Number>} Deleted count
   */
  async deleteCategory(id, tenantId) {
    try {
      // Check if category has subcategories
      const subcategories = await CategoryModel.find({
        tenantId,
        parentCategoryId: id,
        status: 'ACTIVE'
      });

      if (subcategories.length > 0) {
        throw apiError.badRequest('Cannot delete category with active subcategories');
      }

      return await this.deleteOne(id, tenantId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get parent categories only
   * @param {String} tenantId - Tenant ID
   * @param {Boolean} isActive - Filter by active status
   * @returns {Promise<Array>} Parent categories
   */
  async getParentCategories(tenantId, isActive = true) {
    try {
      return await CategoryModel.findParentCategories(tenantId, isActive);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get subcategories by parent
   * @param {String} tenantId - Tenant ID
   * @param {String} parentCategoryId - Parent category ID
   * @param {Boolean} isActive - Filter by active status
   * @returns {Promise<Array>} Subcategories
   */
  async getSubcategories(tenantId, parentCategoryId, isActive = true) {
    try {
      return await CategoryModel.findSubcategories(tenantId, parentCategoryId, isActive);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get category by slug
   * @param {String} tenantId - Tenant ID
   * @param {String} slug - Category slug
   * @returns {Promise<Object>} Category
   */
  async getCategoryBySlug(tenantId, slug) {
    try {
      const category = await CategoryModel.findBySlug(tenantId, slug);
      
      if (!category) {
        throw apiError.notFound('Category not found');
      }

      return category;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get categories by station type
   * @param {String} tenantId - Tenant ID
   * @param {String} stationType - Station type
   * @param {Boolean} isActive - Filter by active status
   * @returns {Promise<Array>} Categories
   */
  async getCategoriesByStationType(tenantId, stationType, isActive = true) {
    try {
      return await CategoryModel.findByStationType(tenantId, stationType, isActive);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get categories by channel
   * @param {String} tenantId - Tenant ID
   * @param {String} channel - Channel (POS, WEB, APP)
   * @param {Boolean} isActive - Filter by active status
   * @returns {Promise<Array>} Categories
   */
  async getCategoriesByChannel(tenantId, channel, isActive = true) {
    try {
      return await CategoryModel.findByChannel(tenantId, channel, isActive);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }
}

export default new CategoryService();
