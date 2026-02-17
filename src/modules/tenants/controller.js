import mongoose from 'mongoose';
import tenantService from './service.js';
import { apiError } from '../../utils/index.js';
import {
  validateCreateTenantData,
  validateUpdateTenantData,
  validateUpdateStatusData,
  validateUpdateBrandingData,
  validateUpdateSubscriptionData
} from './validation.js';

/**
 * Tenant Controller
 * Handles HTTP requests for tenant operations
 */

/**
 * Unified GET endpoint - handles all query types
 * GET /api/v1/tenants
 * 
 * Query Parameters:
 * - id: Get specific tenant by ID
 * - slug: Get specific tenant by slug
 * - domain: Get specific tenant by domain
 * - subscriptionStatus: Get subscription status (requires id)
 * - moduleAccess: Check module access (requires id)
 * - status: Filter by status (for list)
 * - search: Search by name/slug (for list)
 * - page, limit: Pagination (for list)
 */
export const getAll = async (req, res, next) => {
  try {
    const { 
      id, 
      slug, 
      domain, 
      subscriptionStatus, 
      moduleAccess,
      status, 
      page = 1, 
      limit = 10, 
      search 
    } = req.query;

    // Get by ID
    if (id) {
      // Check if requesting subscription status
      if (subscriptionStatus === 'true') {
        const tenant = await tenantService.getTenantById(id);
        if (!tenant) {
          return next(apiError.notFound('Tenant not found'));
        }

        // Check if subscription is active
        const isActive = tenant.subscription.status === 'ACTIVE' && 
                        new Date() <= new Date(tenant.subscription.endDate);
        
        const now = new Date();
        const daysUntilExpiry = Math.ceil(
          (new Date(tenant.subscription.endDate) - now) / (1000 * 60 * 60 * 24)
        );

        return res.status(200).send({
          isSuccess: true,
          message: 'Subscription status retrieved successfully',
          data: {
            isActive,
            status: tenant.subscription.status,
            planId: tenant.subscription.planId,
            startDate: tenant.subscription.startDate,
            endDate: tenant.subscription.endDate,
            daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0
          }
        });
      }

      // Check if requesting module access
      if (moduleAccess) {
        const tenant = await tenantService.getTenantById(id);
        if (!tenant) {
          return next(apiError.notFound('Tenant not found'));
        }

        const hasAccess = await tenantService.checkModuleAccess(id, moduleAccess);

        return res.status(200).send({
          isSuccess: true,
          message: 'Module access retrieved successfully',
          data: {
            hasAccess,
            moduleKey: moduleAccess
          }
        });
      }

      // Regular get by ID
      const tenant = await tenantService.getTenantById(id);
      if (!tenant) {
        return next(apiError.notFound('Tenant not found'));
      }

      return res.status(200).send({
        isSuccess: true,
        message: 'Tenant retrieved successfully',
        data: tenant
      });
    }

    // Get by slug
    if (slug) {
      const tenant = await tenantService.getTenantBySlug(slug);
      if (!tenant) {
        return next(apiError.notFound('Tenant not found with this slug'));
      }

      return res.status(200).send({
        isSuccess: true,
        message: 'Tenant retrieved successfully',
        data: tenant
      });
    }

    // Get by domain
    if (domain) {
      const tenant = await tenantService.getTenantByDomain(domain);
      if (!tenant) {
        return next(apiError.notFound('Tenant not found for this domain'));
      }

      return res.status(200).send({
        isSuccess: true,
        message: 'Tenant retrieved successfully',
        data: tenant
      });
    }

    // Get all tenants with filters
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;

    const result = await tenantService.getAllTenants(
      parseInt(page),
      parseInt(limit),
      filters
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'Tenants retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in getAll:', error);
    return next(apiError.internal(error, 'getAll'));
  }
};

/**
 * Get tenant by ID
 * GET /api/v1/tenants/:id
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await tenantService.getTenantById(id);

    if (!tenant) {
      return next(apiError.notFound('Tenant not found'));
    }

    return res.status(200).send({
      isSuccess: true,
      message: 'Tenant retrieved successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error in getById:', error);
    return next(apiError.internal(error, 'getById'));
  }
};

/**
 * Get tenant by slug
 * GET /api/v1/tenants/slug/:slug
 */
export const getBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const tenant = await tenantService.getTenantBySlug(slug);

    if (!tenant) {
      return next(apiError.notFound('Tenant not found'));
    }

    return res.status(200).send({
      isSuccess: true,
      message: 'Tenant retrieved successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error in getBySlug:', error);
    return next(apiError.internal(error, 'getBySlug'));
  }
};

/**
 * Get tenant by domain
 * GET /api/v1/tenants/domain/:domain
 */
export const getByDomain = async (req, res, next) => {
  try {
    const { domain } = req.params;

    const tenant = await tenantService.getTenantByDomain(domain);

    if (!tenant) {
      return next(apiError.notFound('Tenant not found for this domain'));
    }

    return res.status(200).send({
      isSuccess: true,
      message: 'Tenant retrieved successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error in getByDomain:', error);
    return next(apiError.internal(error, 'getByDomain'));
  }
};

/**
 * Create tenant
 * POST /api/v1/tenants
 */
export const create = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    // Validate input
    const validationResult = validateCreateTenantData(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'create'));
    }

    // Validate domains - ensure exactly one default
    const defaultDomains = req.body.domains.filter(d => d.isDefault);
    if (defaultDomains.length !== 1) {
      return next(apiError.badRequest('Exactly one domain must be marked as default', 'create'));
    }

    // Create tenant
    const tenant = await tenantService.createTenant(req.body, userId);

    return res.status(201).send({
      isSuccess: true,
      message: 'Tenant created successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error in create:', error);
    return next(apiError.internal(error, 'create'));
  }
};

/**
 * Update tenant
 * PUT /api/v1/tenants/:id
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    // Validate input
    const validationResult = validateUpdateTenantData(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'update'));
    }

    // If updating domains, validate exactly one default
    if (req.body.domains) {
      const defaultDomains = req.body.domains.filter(d => d.isDefault);
      if (defaultDomains.length !== 1) {
        return next(apiError.badRequest('Exactly one domain must be marked as default', 'update'));
      }
    }

    // Update tenant
    const tenant = await tenantService.updateTenant(id, req.body, userId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Tenant updated successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error in update:', error);
    return next(apiError.internal(error, 'update'));
  }
};

/**
 * Update tenant status
 * PATCH /api/v1/tenants/:id/status
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    // Validate input
    const validationResult = validateUpdateStatusData(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'updateStatus'));
    }

    // Update status
    const tenant = await tenantService.updateTenantStatus(id, status, userId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Tenant status updated successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error in updateStatus:', error);
    return next(apiError.internal(error, 'updateStatus'));
  }
};

/**
 * Update tenant branding
 * PATCH /api/v1/tenants/:id/branding
 */
export const updateBranding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branding } = req.body;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    // Validate input
    const validationResult = validateUpdateBrandingData(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'updateBranding'));
    }

    // Update branding
    const tenant = await tenantService.updateTenant(id, { branding }, userId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Tenant branding updated successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error in updateBranding:', error);
    return next(apiError.internal(error, 'updateBranding'));
  }
};

/**
 * Update tenant subscription
 * PATCH /api/v1/tenants/:id/subscription
 */
export const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subscription } = req.body;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    // Validate input
    const validationResult = validateUpdateSubscriptionData(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'updateSubscription'));
    }

    // Update subscription
    const tenant = await tenantService.updateTenantSubscription(id, subscription, userId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Tenant subscription updated successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error in updateSubscription:', error);
    return next(apiError.internal(error, 'updateSubscription'));
  }
};

/**
 * Delete tenant (soft delete)
 * DELETE /api/v1/tenants/:id
 */
export const deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    await tenantService.deleteTenant(id, userId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTenant:', error);
    return next(apiError.internal(error, 'deleteTenant'));
  }
};

/**
 * Check if tenant subscription is active
 * GET /api/v1/tenants/:id/subscription-status
 */
export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isActive = await tenantService.isSubscriptionActive(id);

    return res.status(200).send({
      isSuccess: true,
      message: 'Subscription status retrieved successfully',
      data: {
        isActive
      }
    });
  } catch (error) {
    console.error('Error in getSubscriptionStatus:', error);
    return next(apiError.internal(error, 'getSubscriptionStatus'));
  }
};

/**
 * Check module access for tenant
 * GET /api/v1/tenants/:id/module-access/:moduleKey
 */
export const checkModuleAccess = async (req, res, next) => {
  try {
    const { id, moduleKey } = req.params;

    const hasAccess = await tenantService.checkModuleAccess(id, moduleKey);

    return res.status(200).send({
      isSuccess: true,
      message: 'Module access checked successfully',
      data: {
        moduleKey,
        hasAccess
      }
    });
  } catch (error) {
    console.error('Error in checkModuleAccess:', error);
    return next(apiError.internal(error, 'checkModuleAccess'));
  }
};

export default {
  getAll,
  getById,
  getBySlug,
  getByDomain,
  create,
  update,
  updateStatus,
  updateBranding,
  updateSubscription,
  deleteTenant,
  getSubscriptionStatus,
  checkModuleAccess
};
