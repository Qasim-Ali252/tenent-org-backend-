import { Router } from 'express';
import controller from './controller.js';
import isAuthorized from '../../../middleware/auth.js';

const router = Router();

/**
 * Organization Settings Routes
 * All routes are protected with authentication
 * 
 * Note: Each tenant has exactly ONE settings record (enforced by unique index)
 * All operations use tenantId as the identifier
 */

// Get settings by tenant ID
router.get('/:tenantId', isAuthorized, controller.getByTenant);

// Create organization settings
router.post('/', isAuthorized, controller.create);

// Update entire settings (by tenant ID)
router.put('/:tenantId', isAuthorized, controller.update);

// Update specific field(s) - handles logo, sections, or any field
router.patch('/:tenantId', isAuthorized, controller.updateFields);

// Restore archived settings (by tenant ID)
router.patch('/:tenantId/restore', isAuthorized, controller.restoreSettings);

// Delete settings - soft delete (by tenant ID)
router.delete('/:tenantId', isAuthorized, controller.deleteSettings);

// Get subscription status
router.get('/:tenantId/subscription-status', isAuthorized, controller.getSubscriptionStatus);

// Calculate order charges
router.post('/:tenantId/calculate-charges', isAuthorized, controller.calculateCharges);

// Validate order value
router.post('/:tenantId/validate-order', isAuthorized, controller.validateOrder);

export default router;
