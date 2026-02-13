import { Router } from 'express';
import controller from './controller.js';
// import { isAuthorized } from '../../../middleware/index.js'; // TEMPORARILY DISABLED FOR TESTING

const router = Router();

/**
 * organization settings Routes
 * âš ï¸ WARNING: Authentication temporarily disabled for testing
 * TODO: Re-enable isAuthorized middleware before production deployment
 */

// Get settings by tenant ID
router.get('/:tenantId', controller.getByTenant);

// Get settings by ID
router.get('/detail/:id', controller.getById);

// Create organization settings
router.post('/', controller.create);

// Update organization settings
router.put('/:id', controller.update);

// Update specific section
router.patch('/:id/section', controller.updateSection);

// Update logo
router.patch('/:id/logo', controller.updateLogo);

// Delete logo
router.delete('/:id/logo', controller.deleteLogo);

// Restore archived settings
router.patch('/:id/restore', controller.restoreSettings);

// Delete settings (soft delete)
router.delete('/:id', controller.deleteSettings);

// Get subscription status
router.get('/:tenantId/subscription-status', controller.getSubscriptionStatus);

// Calculate order charges
router.post('/:tenantId/calculate-charges', controller.calculateCharges);

// Validate order value
router.post('/:tenantId/validate-order', controller.validateOrder);

export default router;
