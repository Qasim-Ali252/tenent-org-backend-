import GlobalService from '../../../utils/globalService.js';
import RoleModel from './model.js';
import { apiError } from '../../../utils/index.js';

/**
 * RoleService - Service layer for role operations
 * Extends GlobalService for common CRUD operations
 */
class RoleService extends GlobalService {
  constructor() {
    super(RoleModel);
  }

  /**
   * Get role by ID
   * @param {String} roleId - Role ID
   * @param {String} populateFields - Fields to populate
   * @param {String} tenantId - Tenant ID
   * @returns {Object|null} Role or null
   */
  async getRoleById(roleId, populateFields = 'permissions', tenantId) {
    return await this.getById(
      roleId,
      { populate: populateFields },
      tenantId
    );
  }

  /**
   * Get role by key
   * @param {String} tenantId - Tenant ID
   * @param {String} roleKey - Role key
   * @returns {Object|null} Role or null
   */
  async getByKey(tenantId, roleKey) {
    return await this.getOneByConditions(
      { roleKey: roleKey.toUpperCase() },
      { populate: 'permissions' },
      tenantId
    );
  }

  /**
   * Get all roles for a tenant
   * @param {String} tenantId - Tenant ID
   * @param {Boolean} isActive - Active filter (default: true)
   * @returns {Array} Array of roles
   */
  async getByTenant(tenantId, isActive = true) {
    const filters = isActive !== null ? { isActive } : {};
    return await this.getAll(
      filters,
      { sort: { name: 1 }, populate: 'permissions' },
      tenantId
    );
  }

  /**
   * Get roles by scope
   * @param {String} tenantId - Tenant ID
   * @param {String} scope - Role scope (GLOBAL or BRANCH)
   * @returns {Array} Array of roles
   */
  async getByScope(tenantId, scope) {
    return await this.getAll(
      { scope, isActive: true },
      { sort: { name: 1 }, populate: 'permissions' },
      tenantId
    );
  }

  /**
   * Get system roles
   * @param {String} tenantId - Tenant ID
   * @returns {Array} Array of system roles
   */
  async getSystemRoles(tenantId) {
    return await this.getAll(
      { isSystemRole: true, isActive: true },
      { sort: { name: 1 }, populate: 'permissions' },
      tenantId
    );
  }

  /**
   * Get all roles with pagination
   * @param {String} tenantId - Tenant ID
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {Object} filters - Query filters
   * @returns {Object} { roles, total, page, totalPages }
   */
  async getAllRoles(tenantId, page = 1, limit = 10, filters = {}) {
    const query = {};
    
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.scope) query.scope = filters.scope;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { roleKey: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const result = await this.getAllWithPagination(
      query,
      page,
      limit,
      { sort: { name: 1 }, populate: 'permissions' },
      tenantId
    );

    return {
      roles: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  }

  /**
   * Create role with validation
   * @param {String} tenantId - Tenant ID
   * @param {Object} data - Role data
   * @param {String} userId - User ID creating the role
   * @returns {Object} Created role
   */
  async createRole(tenantId, data, userId) {
    // Check if roleKey already exists
    const exists = await this.exists(
      { roleKey: data.roleKey.toUpperCase() },
      tenantId
    );

    if (exists) {
      throw apiError.badRequest('Role key already exists');
    }

    return await this.create({
      ...data,
      tenantId,
      roleKey: data.roleKey.toUpperCase(),
      addedUser: userId,
      modifiedUser: userId
    }, { populate: 'permissions' });
  }

  /**
   * Update role with validation
   * @param {String} roleId - Role ID
   * @param {String} tenantId - Tenant ID
   * @param {Object} data - Update data
   * @param {String} userId - User ID modifying the role
   * @returns {Object} Updated role
   */
  async updateRole(roleId, tenantId, data, userId) {
    const role = await this.Model.findOne({ _id: roleId, tenantId });
    
    if (!role) {
      throw apiError.notFound('Role not found');
    }

    // Prevent updating system roles
    if (role.isSystemRole && (data.roleKey || data.isSystemRole === false)) {
      throw apiError.forbidden('Cannot modify system role key or system status');
    }

    // If updating roleKey, check uniqueness
    if (data.roleKey) {
      const existing = await this.getOneByConditions(
        { roleKey: data.roleKey.toUpperCase(), _id: { $ne: roleId } },
        {},
        tenantId
      );

      if (existing) {
        throw apiError.badRequest('Role key already exists');
      }
      data.roleKey = data.roleKey.toUpperCase();
    }

    return await this.update(
      roleId,
      {
        ...data,
        modifiedUser: userId
      },
      { populate: 'permissions' },
      tenantId
    );
  }

  /**
   * Add permission to role
   * @param {String} roleId - Role ID
   * @param {String} tenantId - Tenant ID
   * @param {String} permissionId - Permission ID
   * @param {String} userId - User ID modifying the role
   * @returns {Object} Updated role
   */
  async addPermission(roleId, tenantId, permissionId, userId) {
    const role = await this.Model.findOne({ _id: roleId, tenantId });
    
    if (!role) {
      throw apiError.notFound('Role not found');
    }

    role.modifiedUser = userId;
    const updated = await role.addPermission(permissionId);
    return updated.toJSON();
  }

  /**
   * Remove permission from role
   * @param {String} roleId - Role ID
   * @param {String} tenantId - Tenant ID
   * @param {String} permissionId - Permission ID
   * @param {String} userId - User ID modifying the role
   * @returns {Object} Updated role
   */
  async removePermission(roleId, tenantId, permissionId, userId) {
    const role = await this.Model.findOne({ _id: roleId, tenantId });
    
    if (!role) {
      throw apiError.notFound('Role not found');
    }

    role.modifiedUser = userId;
    const updated = await role.removePermission(permissionId);
    return updated.toJSON();
  }

  /**
   * Set permissions for role (replace all)
   * @param {String} roleId - Role ID
   * @param {String} tenantId - Tenant ID
   * @param {Array} permissionIds - Array of permission IDs
   * @param {String} userId - User ID modifying the role
   * @returns {Object} Updated role
   */
  async setPermissions(roleId, tenantId, permissionIds, userId) {
    return await this.update(
      roleId,
      { 
        permissions: permissionIds,
        modifiedUser: userId
      },
      { populate: 'permissions' },
      tenantId
    );
  }

  /**
   * Check if role has permission
   * @param {String} roleId - Role ID
   * @param {String} permissionId - Permission ID
   * @returns {Boolean} True if has permission
   */
  async hasPermission(roleId, permissionId) {
    const role = await this.Model.findById(roleId);
    
    if (!role) {
      throw apiError.notFound('Role not found');
    }

    return role.hasPermission(permissionId);
  }

  /**
   * Check if role has permission by key
   * @param {String} roleId - Role ID
   * @param {String} permissionKey - Permission key
   * @returns {Boolean} True if has permission
   */
  async hasPermissionByKey(roleId, permissionKey) {
    const role = await this.Model.findById(roleId).populate('permissions');
    
    if (!role) {
      throw apiError.notFound('Role not found');
    }

    return await role.hasPermissionByKey(permissionKey);
  }

  /**
   * Delete role (soft delete)
   * @param {String} roleId - Role ID
   * @param {String} tenantId - Tenant ID
   * @param {String} userId - User ID deleting the role
   * @returns {Object} Updated role
   */
  async deleteRole(roleId, tenantId, userId) {
    const role = await this.Model.findOne({ _id: roleId, tenantId });
    
    if (!role) {
      throw apiError.notFound('Role not found');
    }

    // Prevent deleting system roles
    if (role.isSystemRole) {
      throw apiError.forbidden('Cannot delete system role');
    }

    // Check if any users have this role
    const UserModel = (await import('../users/model.js')).default;
    const userCount = await UserModel.countDocuments({ roleId, tenantId });
    
    if (userCount > 0) {
      throw apiError.badRequest(`Cannot delete role. ${userCount} user(s) are assigned to this role`);
    }

    return await this.update(
      roleId,
      { 
        isActive: false,
        modifiedUser: userId
      },
      {},
      tenantId
    );
  }

  /**
   * Hard delete role
   * @param {String} roleId - Role ID
   * @param {String} tenantId - Tenant ID
   * @returns {Object} Deleted role
   */
  async hardDeleteRole(roleId, tenantId) {
    const role = await this.Model.findOne({ _id: roleId, tenantId });
    
    if (!role) {
      throw apiError.notFound('Role not found');
    }

    // Prevent deleting system roles
    if (role.isSystemRole) {
      throw apiError.forbidden('Cannot delete system role');
    }

    // Check if any users have this role
    const UserModel = (await import('../users/model.js')).default;
    const userCount = await UserModel.countDocuments({ roleId, tenantId });
    
    if (userCount > 0) {
      throw apiError.badRequest(`Cannot delete role. ${userCount} user(s) are assigned to this role`);
    }

    return await this.hardDeleteOne(roleId, tenantId);
  }

  /**
   * Count roles
   * @param {String} tenantId - Tenant ID
   * @param {Object} condition - Additional conditions
   * @returns {Number} Count
   */
  async countRoles(tenantId, condition = {}) {
    return await this.countDocuments(condition, tenantId);
  }

  /**
   * Clone role (create a copy)
   * @param {String} roleId - Source role ID
   * @param {String} tenantId - Tenant ID
   * @param {String} newRoleKey - New role key
   * @param {String} newName - New role name
   * @param {String} userId - User ID creating the role
   * @returns {Object} Created role
   */
  async cloneRole(roleId, tenantId, newRoleKey, newName, userId) {
    const sourceRole = await this.Model.findOne({ _id: roleId, tenantId }).populate('permissions');
    
    if (!sourceRole) {
      throw apiError.notFound('Source role not found');
    }

    // Check if new roleKey already exists
    const exists = await this.exists(
      { roleKey: newRoleKey.toUpperCase() },
      tenantId
    );

    if (exists) {
      throw apiError.badRequest('Role key already exists');
    }

    return await this.create({
      tenantId,
      roleKey: newRoleKey.toUpperCase(),
      name: newName,
      description: sourceRole.description,
      permissions: sourceRole.permissions.map(p => p._id),
      scope: sourceRole.scope,
      isSystemRole: false,
      addedUser: userId,
      modifiedUser: userId
    }, { populate: 'permissions' });
  }
}

// Export singleton instance
export default new RoleService();
