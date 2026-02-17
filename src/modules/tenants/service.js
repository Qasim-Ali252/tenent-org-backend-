import GlobalService from '../../utils/globalService.js';
import TenantModel from './model.js';
import { apiError } from '../../utils/index.js';

/**
 * TenantService - Service layer for tenant operations
 * Extends GlobalService for common CRUD operations
 * Note: Tenants don't have tenantId field, so bypass is used
 */
class TenantService extends GlobalService {
  constructor() {
    super(TenantModel);
  }


  async getTenantById(tenantId, populateFields = null) {
    return await this.getById(
      tenantId,
      { populate: populateFields },
      null,
      true // bypass tenant check since tenants don't have tenantId
    );
  }

 
  async getTenantByConditions(condition, removeFields = '') {
    return await this.getOneByConditions(
      condition,
      { select: removeFields },
      null,
      true // bypass
    );
  }

  
  async getTenantBySlug(slug) {
    return await this.getOneByConditions(
      { slug: slug.toLowerCase(), status: 'ACTIVE' },
      {},
      null,
      true // bypass
    );
  }

  
  async getTenantByDomain(domain) {
    const tenant = await this.Model.findByDomain(domain);
    return tenant ? tenant.toJSON() : null;
  }

  
  async getAllTenants(page = 1, limit = 10, filters = {}) {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { slug: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const result = await this.getAllWithPagination(
      query,
      page,
      limit,
      { sort: { createdAt: -1 } },
      null,
      true // bypass
    );

    return {
      tenants: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  }

  
  async createTenant(data, userId) {
    // Check if slug already exists
    const slugExists = await this.exists(
      { slug: data.slug },
      null,
      true // bypass
    );

    if (slugExists) {
      throw apiError.badRequest('Tenant with this slug already exists');
    }

    // Check if domain already exists
    if (data.domains && data.domains.length > 0) {
      const domainList = data.domains.map(d => d.domain);
      const domainExists = await this.exists(
        { 'domains.domain': { $in: domainList } },
        null,
        true // bypass
      );

      if (domainExists) {
        throw apiError.badRequest('One or more domains already exist');
      }
    }

    return await this.create({
      ...data,
      addedUser: userId,
      modifiedUser: userId
    }, {});
  }

  
  async updateTenant(tenantId, data, userId) {
    // If updating slug, check uniqueness
    if (data.slug) {
      const existing = await this.getOneByConditions(
        { slug: data.slug, _id: { $ne: tenantId } },
        {},
        null,
        true // bypass
      );

      if (existing) {
        throw apiError.badRequest('Tenant with this slug already exists');
      }
    }

    // If updating domains, check uniqueness
    if (data.domains && data.domains.length > 0) {
      const domainList = data.domains.map(d => d.domain);
      const existing = await this.getOneByConditions(
        { 'domains.domain': { $in: domainList }, _id: { $ne: tenantId } },
        {},
        null,
        true // bypass
      );

      if (existing) {
        throw apiError.badRequest('One or more domains already exist');
      }
    }

    return await this.update(
      tenantId,
      {
        ...data,
        modifiedUser: userId
      },
      {},
      null,
      true // bypass
    );
  }

  
  async updateTenantStatus(tenantId, status, userId) {
    return await this.update(
      tenantId,
      { 
        status,
        modifiedUser: userId
      },
      {},
      null,
      true // bypass
    );
  }

  

  async updateTenantSubscription(tenantId, subscriptionData, userId) {
    return await this.update(
      tenantId,
      { 
        subscription: subscriptionData,
        modifiedUser: userId
      },
      {},
      null,
      true // bypass
    );
  }

  

  async deleteTenant(tenantId, userId) {
    return await this.update(
      tenantId,
      { 
        status: 'INACTIVE',
        modifiedUser: userId
      },
      {},
      null,
      true // bypass
    );
  }

  

  async hardDeleteTenant(tenantId) {
    return await this.hardDeleteOne(tenantId, null, true);
  }

  
  async countTenants(condition = {}) {
    return await this.countDocuments(condition, null, true);
  }

  

  async checkModuleAccess(tenantId, moduleKey) {
    const tenant = await this.Model.findById(tenantId);
    if (!tenant) {
      throw apiError.notFound('Tenant not found');
    }
    return await tenant.hasModuleAccess(moduleKey);
  }

 
  
  async isSubscriptionActive(tenantId) {
    const tenant = await this.Model.findById(tenantId);
    if (!tenant) {
      throw apiError.notFound('Tenant not found');
    }
    return tenant.isSubscriptionActive();
  }
}

// Export singleton instance
export default new TenantService();
