import GlobalService from '../../../utils/globalService.js';
import PermissionModel from './model.js';

/**
 * PermissionService - Service layer for permission operations
 */
class PermissionService extends GlobalService {
  constructor() {
    super(PermissionModel);
  }

  /**
   * Create a new permission
   */
  async createPermission(data, userId) {
    if (data.key) data.key = data.key.toUpperCase();
    return await this.model.create(data);
  }

  /**
   * Bulk create permissions (Seed)
   * @param {Array} permissions - Array of permission objects
   * @returns {Promise<Array>} Created permissions
   */
  async seedPermissions(permissions) {
    // Process permissions
    const processed = permissions.map(p => ({
        ...p,
        key: p.key.toUpperCase(),
        method: p.method ? p.method.toUpperCase() : 'GET'
    }));

    // Upsert logic (optional, but good for seeding)
    const results = [];
    for (const p of processed) {
        const result = await PermissionModel.findOneAndUpdate(
            { key: p.key },
            p,
            { upsert: true, new: true }
        );
        results.push(result);
    }
    return results;
  }

  /**
   * Get all active permissions grouped by module
   */
  async getPermissionsByModule() {
    const permissions = await PermissionModel.find({ isActive: true })
        .sort({ moduleKey: 1, displayOrder: 1 });
    
    // Grouping logic (useful for frontend UI)
    const grouped = permissions.reduce((acc, p) => {
        const module = p.moduleKey || 'GENERAL';
        if (!acc[module]) acc[module] = [];
        acc[module].push(p);
        return acc;
    }, {});

    return grouped;
  }
}

export default new PermissionService();
