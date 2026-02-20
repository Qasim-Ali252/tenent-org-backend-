import { Router } from 'express';
import controller from './controller.js';
import isAuthorized from '../../../middleware/auth.js';

const router = Router();

const superAdminGuard = (req, res, next) => {
  const secret = req.headers['x-super-admin-secret'];
  const expected = process.env.SUPER_ADMIN_SECRET;

  if (!expected) {
    return res.status(500).json({
      error: 'SUPER_ADMIN_SECRET is not configured on the server.'
    });
  }

  if (!secret || secret !== expected) {
    return res.status(403).json({
      error: 'Access denied. Invalid or missing super admin secret.'
    });
  }

  next();
};

/**
 * Authentication Routes
 */

// Super Admin — grant access to a new admin (Postman only, no dashboard yet)
router.post('/grant-access', superAdminGuard, controller.grantAccess);

// Admin — set password for first time (no auth token required)
router.post('/set-password', controller.setPassword);

// Public routes (no authentication required)
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Protected routes (authentication required)
router.post('/logout', isAuthorized, controller.logout);
router.post('/refresh', controller.refreshToken);
router.post('/change-password', isAuthorized, controller.changePassword);
router.get('/me', isAuthorized, controller.getCurrentUser);
router.put('/profile', isAuthorized, controller.updateProfile);

export default router;
