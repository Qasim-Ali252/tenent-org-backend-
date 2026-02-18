import { Router } from 'express';
import controller from './controller.js';
import isAuthorized from '../../middleware/auth.js';

const router = Router();

/**
 * Branch Routes
 * All routes are protected with authentication
 * 
 * Main GET endpoint supports flexible filtering:
 * - GET /branches - Get all branches with pagination
 * - GET /branches?status=ACTIVE - Filter by status
 * - GET /branches?code=MB-001 - Get by code
 * - GET /branches?id=123 - Get by ID (or use /branches/:id)
 * - GET /branches/:id - Get by ID (traditional REST style)
 * - GET /branches?nearby=true&longitude=-122.4194&latitude=37.7749 - Get nearby
 * - GET /branches?search=downtown - Search branches
 * - GET /branches?capability=hasDelivery - Filter by capability
 */

// Single unified GET endpoint with flexible filtering
router.get('/', isAuthorized, controller.getAll);

// Traditional REST endpoint for getting by ID (must be after other routes)
router.get('/:id', isAuthorized, controller.getById);

// Create branch
router.post('/',  controller.create);

// Update branch
router.put('/:id', isAuthorized, controller.update);

// Update branch status
router.patch('/:id/status', isAuthorized, controller.updateStatus);

// Update branch manager
router.patch('/:id/manager', isAuthorized, controller.updateManager);

// Delete branch (soft delete)
router.delete('/:id', isAuthorized, controller.deleteBranch);

export default router;
