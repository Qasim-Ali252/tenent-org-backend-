import mongoose from 'mongoose';
import branchService from './service.js';
import { apiError } from '../../utils/index.js';
import {
  validateCreateBranch,
  validateUpdateBranch,
  validateUpdateStatus,
  validateUpdateManager,
  validateNearbyQuery
} from './validation.js';

/**
 * Branch Controller
 * Handles HTTP requests for branch operations
 */

/**
 * Get all branches with flexible filtering
 * GET /api/v1/branches
 * 
 * Query Parameters:
 * - status: Filter by status (ACTIVE, INACTIVE, DRAFT, ARCHIVED, PENDING, SUSPENDED)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search by name, code, or city
 * - capability: Filter by capability (hasDineIn, hasTakeaway, hasDelivery, hasDriveThru, hasKiosk)
 * - code: Get branch by specific code
 * - id: Get branch by specific ID
 * - nearby: Get nearby branches (requires longitude, latitude, maxDistance)
 * - longitude: Longitude for nearby search
 * - latitude: Latitude for nearby search
 * - maxDistance: Max distance in meters for nearby search (default: 10000)
 */
export const getAll = async (req, res, next) => {
  try {
    // Get tenantId from user's companyId or query parameter (optional)
    const tenantId = req.user?.companyId || req.query.tenantId || req.companyId || null;
    
    const { 
      status, 
      page = 1, 
      limit = 10, 
      search, 
      capability,
      code,
      id,
      nearby,
      longitude,
      latitude,
      maxDistance = 10000
    } = req.query;

    // Handle specific ID query
    if (id) {
      const branch = await branchService.getById(id, {}, tenantId);
      if (!branch) {
        return next(apiError.notFound('Branch not found'));
      }
      return res.status(200).send({
        isSuccess: true,
        message: 'Branch retrieved successfully',
        data: branch,
        total: 1
      });
    }

    // Handle code query
    if (code) {
      const branch = await branchService.getByCode(tenantId, code);
      if (!branch) {
        return next(apiError.notFound('Branch not found'));
      }
      return res.status(200).send({
        isSuccess: true,
        message: 'Branch retrieved successfully',
        data: branch,
        total: 1
      });
    }

    // Handle nearby query
    if (nearby === 'true' && longitude && latitude) {
      const validationResult = validateNearbyQuery({ longitude, latitude, maxDistance });
      if (validationResult?.error) {
        return next(apiError.badRequest(validationResult?.msg, 'getAll'));
      }

      const branches = await branchService.findNearby(
        tenantId,
        parseFloat(longitude),
        parseFloat(latitude),
        parseInt(maxDistance)
      );

      return res.status(200).send({
        isSuccess: true,
        message: 'Nearby branches retrieved successfully',
        data: branches,
        total: branches.length
      });
    }

    // Handle regular filtered query with pagination
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (capability) filters.capability = capability;

    const result = await branchService.getAllBranches(
      tenantId,
      parseInt(page),
      parseInt(limit),
      filters
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'Branches retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in getAll:', error);
    return next(apiError.internal(error, 'getAll'));
  }
};

/**
 * Get branch by ID
 * GET /api/v1/branches/:id
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantOrgId || req.query.tenantId;

    const branch = await branchService.getById(id, {}, tenantId); // Removed populate

    if (!branch) {
      return next(apiError.notFound('Branch not found'));
    }

    return res.status(200).send({
      isSuccess: true,
      message: 'Branch retrieved successfully',
      data: branch
    });
  } catch (error) {
    console.error('Error in getById:', error);
    return next(apiError.internal(error, 'getById'));
  }
};

/**
 * Get branch by code
 * GET /api/v1/branches/code/:code
 */
export const getByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const tenantId = req.user?.tenantOrgId || req.query.tenantId;

    const branch = await branchService.getByCode(tenantId, code);

    if (!branch) {
      return next(apiError.notFound('Branch not found'));
    }

    return res.status(200).send({
      isSuccess: true,
      message: 'Branch retrieved successfully',
      data: branch
    });
  } catch (error) {
    console.error('Error in getByCode:', error);
    return next(apiError.internal(error, 'getByCode'));
  }
};

/**
 * Create branch
 * POST /api/v1/branches
 */
export const create = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();
    const tenantId = req.user?.tenantOrgId || req.body.tenantId;

    if (!tenantId) {
      return next(apiError.badRequest('tenantId is required', 'create'));
    }

    // Validate input
    const validationResult = validateCreateBranch(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'create'));
    }

    // Create branch
    const branch = await branchService.createBranch(tenantId, req.body, userId);

    return res.status(201).send({
      isSuccess: true,
      message: 'Branch created successfully',
      data: branch
    });
  } catch (error) {
    console.error('Error in create:', error);
    return next(apiError.internal(error, 'create'));
  }
};

/**
 * Update branch
 * PUT /api/v1/branches/:id
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();
    const tenantId = req.user?.tenantOrgId || req.body.tenantId;

    // Validate input
    const validationResult = validateUpdateBranch(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'update'));
    }

    // Update branch
    const branch = await branchService.updateBranch(id, tenantId, req.body, userId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Branch updated successfully',
      data: branch
    });
  } catch (error) {
    console.error('Error in update:', error);
    return next(apiError.internal(error, 'update'));
  }
};

/**
 * Update branch status
 * PATCH /api/v1/branches/:id/status
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();
    const tenantId = req.user?.tenantOrgId || req.body.tenantId;

    // Validate input
    const validationResult = validateUpdateStatus(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'updateStatus'));
    }

    // Update status
    const branch = await branchService.updateStatus(id, tenantId, status, userId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Branch status updated successfully',
      data: branch
    });
  } catch (error) {
    console.error('Error in updateStatus:', error);
    return next(apiError.internal(error, 'updateStatus'));
  }
};

/**
 * Update branch manager
 * PATCH /api/v1/branches/:id/manager
 */
export const updateManager = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();
    const tenantId = req.user?.tenantOrgId || req.body.tenantId;

    // Validate input
    const validationResult = validateUpdateManager(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'updateManager'));
    }

    // Update manager
    const branch = await branchService.updateManager(id, tenantId, managerId, userId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Branch manager updated successfully',
      data: branch
    });
  } catch (error) {
    console.error('Error in updateManager:', error);
    return next(apiError.internal(error, 'updateManager'));
  }
};

/**
 * Delete branch (soft delete)
 * DELETE /api/v1/branches/:id
 */
export const deleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantOrgId || req.query.tenantId;

    await branchService.deleteOne(id, tenantId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteBranch:', error);
    return next(apiError.internal(error, 'deleteBranch'));
  }
};

/**
 * Get nearby branches
 * GET /api/v1/branches/nearby
 */
export const getNearby = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;
    const tenantId = req.user?.tenantOrgId || req.query.tenantId;

    // Validate input
    const validationResult = validateNearbyQuery({ longitude, latitude, maxDistance });
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'getNearby'));
    }

    const branches = await branchService.findNearby(
      tenantId,
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'Nearby branches retrieved successfully',
      data: branches
    });
  } catch (error) {
    console.error('Error in getNearby:', error);
    return next(apiError.internal(error, 'getNearby'));
  }
};

/**
 * Get active branches
 * GET /api/v1/branches/active
 */
export const getActive = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantOrgId || req.query.tenantId;

    const branches = await branchService.getByTenant(tenantId, 'ACTIVE');

    return res.status(200).send({
      isSuccess: true,
      message: 'Active branches retrieved successfully',
      data: branches
    });
  } catch (error) {
    console.error('Error in getActive:', error);
    return next(apiError.internal(error, 'getActive'));
  }
};

export default {
  getAll,
  getById,
  getByCode,
  create,
  update,
  updateStatus,
  updateManager,
  deleteBranch,
  getNearby,
  getActive
};
