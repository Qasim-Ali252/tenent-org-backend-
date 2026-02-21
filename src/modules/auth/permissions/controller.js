import permissionService from './service.js';
import { apiError } from '../../../utils/apiErrorHandler.js';

class PermissionController {
  /**
   * Create a new permission
   */
  async createPermission(req, res, next) {
    try {
      const { userId, ...permissionData } = req.body;
      const permission = await permissionService.createPermission(permissionData, userId);

      return res.status(201).json({
        isSuccess: true,
        message: 'Permission created successfully',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk create/update permissions (Seeding)
   */
  async seedPermissions(req, res, next) {
    try {
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        throw apiError.badRequest('Permissions must be an array');
      }

      const results = await permissionService.seedPermissions(permissions);

      return res.status(200).json({
        isSuccess: true,
        message: 'Permissions seeded successfully',
        data: results,
        count: results.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all permissions grouped by module
   */
  async getPermissionsGrouped(req, res, next) {
    try {
      const grouped = await permissionService.getPermissionsByModule();
      return res.status(200).json({
        isSuccess: true,
        data: grouped
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions(req, res, next) {
    try {
      const { id, isGrouped } = req.query;

      // Handle grouping if requested
      if (isGrouped) {
        return this.getPermissionsGrouped(req, res, next);
      }

      // Get by ID if provided
      if (id) {
        const permission = await permissionService.getById(id);
        if (!permission) throw apiError.notFound('Permission not found');
        return res.status(200).json({
          isSuccess: true,
          data: permission
        });
      }

      // Default: list all active ones
      const permissions = await permissionService.getActivePermissions ? await permissionService.getActivePermissions() : await permissionService.getAll();
      return res.status(200).json({
        isSuccess: true,
        data: permissions,
        total: permissions.length
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PermissionController();
