import { Router } from 'express';
import controller from './controller.js';
// import { isAuthorized } from '../../middleware/index.js'; // TEMPORARILY DISABLED FOR TESTING

const router = Router();

/**
 * Branch Routes
 * ⚠️ WARNING: Authentication temporarily disabled for testing
 * TODO: Re-enable isAuthorized middleware before production deployment
 */

// Get nearby branches (must be before /:id to avoid route conflict)
router.get('/nearby', controller.getNearby);

// Get active branches
router.get('/active', controller.getActive);

// Get branch by code
router.get('/code/:code', controller.getByCode);

// Get all branches
router.get('/', controller.getAll);

// Get branch by ID
router.get('/:id', controller.getById);

// Create branch
router.post('/', controller.create);

// Update branch
router.put('/:id', controller.update);

// Update branch status
router.patch('/:id/status', controller.updateStatus);

// Update branch manager
router.patch('/:id/manager', controller.updateManager);

// Delete branch (soft delete)
router.delete('/:id', controller.deleteBranch);

export default router;
