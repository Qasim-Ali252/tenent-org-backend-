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
 * GET /api/v1/organization-settings/:tenantId
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
 * Create organization settings
 * POST /api/v1/organization-settings
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
 * PUT /api/v1/organization-settings/:tenantId
 */
export const update = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    // Validate input
    const validationResult = validateUpdateorganizationSettings(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'update'));
    }

    // Update settings by tenant ID
    const settings = await organizationSettingsService.updateSettingsByTenant(
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
 * Update specific field(s) in organization settings
 * PATCH /api/v1/organization-settings/:tenantId
 * 
 * This unified endpoint handles all partial updates:
 * - Update logo: { "logo": "url" }
 * - Delete logo: { "logo": null }
 * - Update any field: { "organizationName": "New Name", "currency": "EUR" }
 * - Update multiple fields: { "defaultTaxPercentage": 10, "serviceChargePercentage": 5 }
 */
export const updateFields = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    // Validate input
    const validationResult = validateUpdateorganizationSettings(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'updateFields'));
    }

    // Update settings by tenant ID
    const settings = await organizationSettingsService.updateSettingsByTenant(
      tenantId,
      req.body,
      userId
    );

    return res.status(200).send({
      isSuccess: true,
      message: 'Organization settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error in updateFields:', error);
    return next(apiError.internal(error, 'updateFields'));
  }
};

/**
 * Delete organization settings (soft delete)
 * DELETE /api/v1/organization-settings/:tenantId
 */
export const deleteSettings = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    // Delete settings by tenant ID
    const settings = await organizationSettingsService.deleteSettingsByTenant(
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
 * PATCH /api/v1/organization-settings/:tenantId/restore
 */
export const restoreSettings = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user?._id || req.body.userId || new mongoose.Types.ObjectId();

    // Restore settings by tenant ID
    const settings = await organizationSettingsService.restoreSettingsByTenant(
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
  create,
  update,
  updateFields,
  deleteSettings,
  restoreSettings,
  getSubscriptionStatus,
  calculateCharges,
  validateOrder
};
