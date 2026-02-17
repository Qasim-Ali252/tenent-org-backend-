import { Router } from 'express';
import controller from './controller.js';
import isAuthorized from '../../middleware/auth.js';

const router = Router();

/**
 * Tenants API Routes
 * All routes are protected with authentication
 * 
 * Main GET endpoint supports flexible querying:
 * - GET /tenants - Get all tenants with pagination
 * - GET /tenants?id=123 - Get by ID
 * - GET /tenants?slug=pizza-palace - Get by slug
 * - GET /tenants?domain=pizzapalace.com - Get by domain
 * - GET /tenants?id=123&subscriptionStatus=true - Get subscription status
 * - GET /tenants?id=123&moduleAccess=orders - Check module access
 * - GET /tenants?status=ACTIVE - Filter by status
 * - GET /tenants?search=pizza - Search tenants
 */

// Single unified GET endpoint with flexible querying
router.get('/', isAuthorized, controller.getAll);

// Create tenant
router.post('/', isAuthorized, controller.create);

// Update tenant (full update)
router.put('/:id', isAuthorized, controller.update);

// Update tenant status
router.patch('/:id/status', isAuthorized, controller.updateStatus);

// Update tenant branding
router.patch('/:id/branding', isAuthorized, controller.updateBranding);

// Update tenant subscription
router.patch('/:id/subscription', isAuthorized, controller.updateSubscription);

// Delete tenant (soft delete)
router.delete('/:id', isAuthorized, controller.deleteTenant);

export default router;
