import GlobalService from '../../utils/globalService.js';
import BranchModel from './model.js';
import { apiError } from '../../utils/index.js';

/**
 * BranchService - Service layer for branch operations
 * Extends GlobalService for common CRUD operations
 */
class BranchService extends GlobalService {
  constructor() {
    super(BranchModel);
  }


  async getByCode(tenantId, code) {
    return await this.getOneByConditions(
      { code: code.toUpperCase() },
      {}, // Removed populate since Employee model doesn't exist yet
      tenantId
    );
  }

 
  async getByTenant(tenantId, status = null) {
    const filters = status ? { status } : {};
    return await this.getAll(
      filters,
      { sort: { name: 1 } }, // Removed populate since Employee model doesn't exist yet
      tenantId
    );
  }

  
  async getAllBranches(tenantId, page = 1, limit = 10, filters = {}) {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } },
        { 'address.city': { $regex: filters.search, $options: 'i' } }
      ];
    }
    if (filters.capability) {
      query[`capabilities.${filters.capability}`] = true;
    }

    const result = await this.getAllWithPagination(
      query,
      page,
      limit,
      { sort: { name: 1 } }, // Removed populate since Employee model doesn't exist yet
      tenantId
    );

    return {
      branches: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  }

  
  async findNearby(tenantId, longitude, latitude, maxDistance = 10000) {
    const branches = await this.Model.find({
      tenantId,
      status: 'ACTIVE',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    }); // Removed populate since Employee model doesn't exist yet

    return branches.map(b => b.toJSON());
  }

 
  async findByCapability(tenantId, capability) {
    const validCapabilities = ['hasDineIn', 'hasTakeaway', 'hasDelivery', 'hasDriveThru', 'hasKiosk'];
    
    if (!validCapabilities.includes(capability)) {
      throw apiError.badRequest('Invalid capability type');
    }

    return await this.getAll(
      { [`capabilities.${capability}`]: true, status: 'ACTIVE' },
      { sort: { name: 1 } }, // Removed populate since Employee model doesn't exist yet
      tenantId
    );
  }

  
  async createBranch(tenantId, data, userId) {
    // Check if branch code already exists
    const exists = await this.exists(
      { code: data.code.toUpperCase() },
      tenantId
    );

    if (exists) {
      throw apiError.badRequest('Branch code already exists for this tenant');
    }

    // Ensure all 7 days are in opening hours
    if (!data.openingHours || data.openingHours.length !== 7) {
      throw apiError.badRequest('Opening hours must include all 7 days');
    }

    return await this.create({
      ...data,
      tenantId,
      code: data.code.toUpperCase(),
      addedUser: userId,
      modifiedUser: userId
    }, {}); // Removed populate since Employee model doesn't exist yet
  }

  
  async updateBranch(branchId, tenantId, data, userId) {
    // If updating code, check uniqueness
    if (data.code) {
      const existing = await this.getOneByConditions(
        { code: data.code.toUpperCase(), _id: { $ne: branchId } },
        {},
        tenantId
      );

      if (existing) {
        throw apiError.badRequest('Branch code already exists for this tenant');
      }

      data.code = data.code.toUpperCase();
    }

    // Validate opening hours if provided
    if (data.openingHours && data.openingHours.length !== 7) {
      throw apiError.badRequest('Opening hours must include all 7 days');
    }

    return await this.update(
      branchId,
      {
        ...data,
        modifiedUser: userId
      },
      {}, // Removed populate since Employee model doesn't exist yet
      tenantId
    );
  }

  
  async updateStatus(branchId, tenantId, status, userId) {
    return await this.update(
      branchId,
      { status, modifiedUser: userId },
      {}, // Removed populate since Employee model doesn't exist yet
      tenantId
    );
  }

  
  async updateManager(branchId, tenantId, managerId, userId) {
    return await this.update(
      branchId,
      { managerId, modifiedUser: userId },
      {}, // Removed populate since Employee model doesn't exist yet
      tenantId
    );
  }

  
  async updateOpeningHours(branchId, tenantId, openingHours, userId) {
    if (openingHours.length !== 7) {
      throw apiError.badRequest('Opening hours must include all 7 days');
    }

    return await this.update(
      branchId,
      { openingHours, modifiedUser: userId },
      {},
      tenantId
    );
  }

  
  async updateCapabilities(branchId, tenantId, capabilities, userId) {
    return await this.update(
      branchId,
      { capabilities, modifiedUser: userId },
      {},
      tenantId
    );
  }

  
  async updateDeliverySettings(branchId, tenantId, deliverySettings, userId) {
    return await this.update(
      branchId,
      { deliverySettings, modifiedUser: userId },
      {},
      tenantId
    );
  }

  
  async isBranchOpen(branchId) {
    const branch = await this.Model.findById(branchId);
    if (!branch) {
      throw apiError.notFound('Branch not found');
    }
    return branch.isCurrentlyOpen();
  }

  
  async getTodayHours(branchId) {
    const branch = await this.Model.findById(branchId);
    if (!branch) {
      throw apiError.notFound('Branch not found');
    }
    return branch.getTodayHours();
  }

  
  async getDeliveryBranches(tenantId, longitude, latitude, maxDistance = 10000) {
    const branches = await this.Model.find({
      tenantId,
      status: 'ACTIVE',
      'capabilities.hasDelivery': true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    }); // Removed populate since Employee model doesn't exist yet

    return branches.map(b => b.toJSON());
  }

  
  async bulkUpdateStatus(tenantId, branchIds, status, userId) {
    const updateFields = branchIds.map(() => ({ status, modifiedUser: userId }));
    return await this.updateMany(branchIds, updateFields, {}, tenantId);
  }
}

// Export singleton instance
export default new BranchService();
