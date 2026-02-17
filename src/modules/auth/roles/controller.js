import roleService from './service.js';
import { apiError } from '../../../utils/apiErrorHandler.js';
import { MESSAGES } from '../../../constants/index.js';

class RoleController {
  /**
   * Create a new role
   */
  async createRole(req, res, next) {
    try {
      const { userId, tenantId, ...roleData } = req.body;
      const role = await roleService.createRole(tenantId, roleData, userId);

      return res.status(201).json({
        isSuccess: true,
        message: 'Role created successfully',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get roles with unified endpoint
   * Supports: get by ID, roleKey, scope, filters, pagination
   */
  async getRoles(req, res, next) {
    try {
      const {
        tenantId,
        id,
        roleKey,
        scope,
        isActive,
        isSystemRole,
        search,
        page,
        limit,
        sort
      } = req.query;

      // Get by ID
      if (id) {
        const role = await roleService.getRoleById(id, 'permissions', tenantId);
        if (!role) {
          throw apiError.notFound('Role not found');
        }
        return res.status(200).json({
          isSuccess: true,
          data: role
        });
      }

      // Get by roleKey
      if (roleKey) {
        const role = await roleService.getByKey(tenantId, roleKey);
        if (!role) {
          throw apiError.notFound('Role not found');
        }
        return res.status(200).json({
          isSuccess: true,
          data: role
        });
      }

      // Get by scope
      if (scope) {
        const roles = await roleService.getByScope(tenantId, scope);
        return res.status(200).json({
          isSuccess: true,
          data: roles,
          total: roles.length
        });
      }

      // Get system roles
      if (isSystemRole === true || isSystemRole === 'true') {
        const roles = await roleService.getSystemRoles(tenantId);
        return res.status(200).json({
          isSuccess: true,
          data: roles,
          total: roles.length
        });
      }

      // Build filters
      const filters = {};
      if (isActive !== undefined) filters.isActive = isActive;
      if (search) filters.search = search;

      // Get with pagination
      if (page && limit) {
        const result = await roleService.getAllRoles(
          tenantId,
          parseInt(page),
          parseInt(limit),
          filters
        );
        return res.status(200).json({
          isSuccess: true,
          data: result.roles,
          total: result.total,
          page: result.page,
          totalPages: result.totalPages
        });
      }

      // Get all
      const roles = await roleService.getByTenant(tenantId, isActive);
      return res.status(200).json({
        isSuccess: true,
        data: roles,
        total: roles.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role by ID (traditional REST endpoint)
   */
  async getRoleById(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;

      const role = await roleService.getRoleById(id, 'permissions', tenantId);
      if (!role) {
        throw apiError.notFound('Role not found');
      }

      return res.status(200).json({
        isSuccess: true,
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update role
   */
  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, tenantId, ...updateData } = req.body;

      const role = await roleService.updateRole(id, tenantId, updateData, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Role updated successfully',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete role (soft delete)
   */
  async deleteRole(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { userId } = req.body;

      await roleService.deleteRole(id, tenantId, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add permission to role
   */
  async addPermission(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { permissionId, userId } = req.body;

      const role = await roleService.addPermission(id, tenantId, permissionId, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Permission added to role successfully',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove permission from role
   */
  async removePermission(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { permissionId, userId } = req.body;

      const role = await roleService.removePermission(id, tenantId, permissionId, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Permission removed from role successfully',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set permissions for role (replace all)
   */
  async setPermissions(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { permissions, userId } = req.body;

      const role = await roleService.setPermissions(id, tenantId, permissions, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Role permissions updated successfully',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clone role
   */
  async cloneRole(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { newRoleKey, newName, userId } = req.body;

      const role = await roleService.cloneRole(id, tenantId, newRoleKey, newName, userId);

      return res.status(201).json({
        isSuccess: true,
        message: 'Role cloned successfully',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RoleController();
