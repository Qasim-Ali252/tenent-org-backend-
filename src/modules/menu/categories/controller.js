import categoryService from './service.js';
import { apiError } from '../../../utils/apiErrorHandler.js';
import { MESSAGES } from '../../../constants/index.js';

class CategoryController {
  /**
   * Create a new category
   */
  async createCategory(req, res, next) {
    try {
      const { userId, ...categoryData } = req.body;
      const category = await categoryService.createCategory(categoryData, userId);

      return res.status(201).json({
        isSuccess: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get categories with unified endpoint
   * Supports: get by ID, slug, filters, pagination
   */
  async getCategories(req, res, next) {
    try {
      const {
        tenantId,
        id,
        slug,
        parentCategoryId,
        stationType,
        channel,
        isActive,
        isParent,
        search,
        page,
        limit,
        sort
      } = req.query;

      // Get by ID
      if (id) {
        const category = await categoryService.getCategoryById(id, tenantId);
        return res.status(200).json({
          isSuccess: true,
          data: category
        });
      }

      // Get by slug
      if (slug) {
        const category = await categoryService.getCategoryBySlug(tenantId, slug);
        return res.status(200).json({
          isSuccess: true,
          data: category
        });
      }

      // Get by station type
      if (stationType) {
        const categories = await categoryService.getCategoriesByStationType(
          tenantId,
          stationType,
          isActive
        );
        return res.status(200).json({
          isSuccess: true,
          data: categories,
          total: categories.length
        });
      }

      // Get by channel
      if (channel) {
        const categories = await categoryService.getCategoriesByChannel(
          tenantId,
          channel,
          isActive
        );
        return res.status(200).json({
          isSuccess: true,
          data: categories,
          total: categories.length
        });
      }

      // Get parent categories only
      if (isParent === true || isParent === 'true') {
        const categories = await categoryService.getParentCategories(tenantId, isActive);
        return res.status(200).json({
          isSuccess: true,
          data: categories,
          total: categories.length
        });
      }

      // Get subcategories by parent
      if (parentCategoryId) {
        const categories = await categoryService.getSubcategories(
          tenantId,
          parentCategoryId,
          isActive
        );
        return res.status(200).json({
          isSuccess: true,
          data: categories,
          total: categories.length
        });
      }

      // Build filters
      const filters = { tenantId };
      if (isActive !== undefined) filters.isActive = isActive;
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Build options
      const options = {
        populate: ['parentCategoryId', 'subcategories'],
        sort: sort || 'sortOrder'
      };

      // Get with pagination
      if (page && limit) {
        const result = await categoryService.getCategoriesWithPagination(
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
      const categories = await categoryService.getAllCategories(filters, options, tenantId);
      return res.status(200).json({
        isSuccess: true,
        data: categories,
        total: categories.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID (traditional REST endpoint)
   */
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;

      const category = await categoryService.getCategoryById(id, tenantId);

      return res.status(200).json({
        isSuccess: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, tenantId, ...updateData } = req.body;

      const category = await categoryService.updateCategory(id, updateData, userId, tenantId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;

      await categoryService.deleteCategory(id, tenantId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
