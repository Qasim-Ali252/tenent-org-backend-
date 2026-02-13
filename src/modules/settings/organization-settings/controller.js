import mongoose from 'mongoose';
import organizationSettingsService from './service.js';
import { apiError } from '../../../utils/index.js';
import {
  validateCreateorganizationSettings,
  validateUpdateorganizationSettings,
  validateUpdateSection,
  validateCalculateCharges,
  validateValidateOrder
} from './validation.js';

/**
 * organization settings Controller
 * Handles HTTP requests for organization settings operations
 */

/**
 * Get organization settings by tenant ID
 * GET /api/v1/practice-settings/:tenantId
 */
export const getByTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const settings = await organizationSettingsService.getByTenant(tenantId);

    if (!settings) {
      return next(apiError.notFound('organization settings not found for this tenant'));
    }

    return res.status(200).send({
      isSuccess: true,
      message: 'organization settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error in getByTenant:', error);
    return next(apiError.internal(error, 'getByTenant'));
  }
};

/**
 * Get organization settings by ID
 * GET /api/v1/practice-settings/detail/:id
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantOrgId;

    const settings = await organizationSettingsService.getSettingsById(id, tenantId);

    if (!settings) {
      return next(apiError.notFound('organization settings not found'));
    }

    return res.status(200).send({
      isSuccess: true,
      message: 'organization settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error in getById:', error);
    return next(apiError.internal(error, 'getById'));
  }
};

/**
 * Create organization settings
 * POST /api/v1/practice-settings
 */
export const create = async (req, res, next) => {
  try {
    // For testing without auth: accept userId and tenantId from body
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();
    const tenantId = req.user?.tenantOrgId || req.body.tenantId;

    if (!tenantId) {
      return next(apiError.badRequest('tenantId is required (provide in body for testing)', 'create'));
    }

    // Validate input
    const validationResult = validateCreateorganizationSettings(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'create'));
    }

    // Create settings
    const settings = await organizationSettingsService.createSettings(
      tenantId,
      req.body,
      userId
    );

    return res.status(201).send({
      isSuccess: true,
      message: 'organization settings created successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error in create:', error);
    return next(apiError.internal(error, 'create'));
  }
};

/**
 * Update organization settings
 * PUT /api/v1/practice-settings/:id
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();
    const tenantId = req.user?.tenantOrgId || req.body.tenantId;

    // Validate input
    const validationResult = validateUpdateorganizationSettings(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'update'));
    }

    // Update settings
    const settings = await organizationSettingsService.updateSettings(
      id,
      tenantId,
      req.body,
      userId
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'organization settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error in update:', error);
    return next(apiError.internal(error, 'update'));
  }
};

/**
 * Update specific section of settings
 * PATCH /api/v1/practice-settings/:id/section
 */
export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { section, ...data } = req.body;
    const userId = req.user?._id;
    const tenantId = req.user?.tenantOrgId;

    // Validate input
    const validationResult = validateUpdateSection(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'updateSection'));
    }

    // Update section
    const settings = await organizationSettingsService.updateSection(
      id,
      tenantId,
      section,
      data,
      userId
    );

    return res.status(200).send({
      isSuccess: true,
      message: `${section} section updated successfully`,
      data: settings
    });
  } catch (error) {
    console.error('Error in updateSection:', error);
    return next(apiError.internal(error, 'updateSection'));
  }
};

/**
 * Update logo
 * PATCH /api/v1/practice-settings/:id/logo
 */
export const updateLogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { logo } = req.body;
    const userId = req.user?._id;
    const tenantId = req.user?.tenantOrgId;

    if (!logo) {
      return next(apiError.badRequest('Logo is required', 'updateLogo'));
    }

    // Update logo
    const settings = await organizationSettingsService.updateLogo(
      id,
      tenantId,
      logo,
      userId
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'Logo updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error in updateLogo:', error);
    return next(apiError.internal(error, 'updateLogo'));
  }
};

/**
 * Delete logo
 * DELETE /api/v1/practice-settings/:id/logo
 */
export const deleteLogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const tenantId = req.user?.tenantOrgId;

    // Delete logo
    const settings = await organizationSettingsService.deleteLogo(
      id,
      tenantId,
      userId
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'Logo deleted successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error in deleteLogo:', error);
    return next(apiError.internal(error, 'deleteLogo'));
  }
};

/**
 * Delete organization settings (soft delete)
 * DELETE /api/v1/practice-settings/:id
 */
export const deleteSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const tenantId = req.user?.tenantOrgId;

    // Delete settings
    const settings = await organizationSettingsService.deleteSettings(
      id,
      tenantId,
      userId
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'organization settings deleted successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error in deleteSettings:', error);
    return next(apiError.internal(error, 'deleteSettings'));
  }
};

/**
 * Restore archived settings
 * PATCH /api/v1/practice-settings/:id/restore
 */
export const restoreSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const tenantId = req.user?.tenantOrgId;

    // Restore settings
    const settings = await organizationSettingsService.restoreSettings(
      id,
      tenantId,
      userId
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'organization settings restored successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error in restoreSettings:', error);
    return next(apiError.internal(error, 'restoreSettings'));
  }
};

/**
 * Get subscription status
 * GET /api/v1/practice-settings/:tenantId/subscription-status
 */
export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const status = await organizationSettingsService.getSubscriptionStatus(tenantId);

    return res.status(200).send({
      isSuccess: true,
      message: 'Subscription status retrieved successfully',
      data: status
    });
  } catch (error) {
    console.error('Error in getSubscriptionStatus:', error);
    return next(apiError.internal(error, 'getSubscriptionStatus'));
  }
};

/**
 * Calculate order charges
 * POST /api/v1/practice-settings/:tenantId/calculate-charges
 */
export const calculateCharges = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { subtotal, includeDelivery } = req.body;

    // Validate input
    const validationResult = validateCalculateCharges(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'calculateCharges'));
    }

    const charges = await organizationSettingsService.calculateOrderCharges(
      tenantId,
      subtotal,
      includeDelivery
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'Order charges calculated successfully',
      data: charges
    });
  } catch (error) {
    console.error('Error in calculateCharges:', error);
    return next(apiError.internal(error, 'calculateCharges'));
  }
};

/**
 * Validate order value
 * POST /api/v1/practice-settings/:tenantId/validate-order
 */
export const validateOrder = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { orderValue } = req.body;

    // Validate input
    const validationResult = validateValidateOrder(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'validateOrder'));
    }

    const validation = await organizationSettingsService.validateOrderValue(
      tenantId,
      orderValue
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'Order validation completed',
      data: validation
    });
  } catch (error) {
    console.error('Error in validateOrder:', error);
    return next(apiError.internal(error, 'validateOrder'));
  }
};

export default {
  getByTenant,
  getById,
  create,
  update,
  updateSection,
  updateLogo,
  deleteLogo,
  deleteSettings,
  restoreSettings,
  getSubscriptionStatus,
  calculateCharges,
  validateOrder
};
