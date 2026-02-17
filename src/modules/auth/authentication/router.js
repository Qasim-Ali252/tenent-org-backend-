import { Router } from 'express';
import controller from './controller.js';
import isAuthorized from '../../../middleware/auth.js';

const router = Router();

/**
 * Authentication Routes
 */

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
