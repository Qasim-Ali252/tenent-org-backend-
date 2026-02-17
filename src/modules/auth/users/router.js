import express from 'express';
import userController from './controller.js';
import { isAuthorized } from '../../../middleware/auth.js';
import { validate } from '../../../validation/index.js';
import {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  deleteUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  updateRoleSchema,
  toggleAccountStatusSchema,
  unlockAccountSchema
} from './validation.js';

const router = express.Router();

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user account
 * @access  Protected
 */
router.post(
  '/',
  isAuthorized,
  validate(createUserSchema),
  userController.createUser
);

/**
 * @route   GET /api/v1/users
 * @desc    Get users (unified endpoint with query parameters)
 * @query   tenantId, id, username, email, employeeId, roleId, status, isAccountEnable, search, page, limit, sort
 * @access  Protected
 */
router.get(
  '/',
  isAuthorized,
  validate(getUsersQuerySchema, 'query'),
  userController.getUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (traditional REST style)
 * @access  Protected
 */
router.get(
  '/:id',
  isAuthorized,
  userController.getUserById
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Protected
 */
router.put(
  '/:id',
  isAuthorized,
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Protected
 */
router.delete(
  '/:id',
  isAuthorized,
  validate(deleteUserSchema, 'query'),
  userController.deleteUser
);

/**
 * @route   POST /api/v1/users/:id/change-password
 * @desc    Change user password
 * @access  Protected
 */
router.post(
  '/:id/change-password',
  isAuthorized,
  validate(changePasswordSchema),
  userController.changePassword
);

/**
 * @route   POST /api/v1/users/:id/reset-password
 * @desc    Reset user password (admin function)
 * @access  Protected
 */
router.post(
  '/:id/reset-password',
  isAuthorized,
  validate(resetPasswordSchema),
  userController.resetPassword
);

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Protected
 */
router.patch(
  '/:id/role',
  isAuthorized,
  validate(updateRoleSchema),
  userController.updateRole
);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Toggle account status (enable/disable)
 * @access  Protected
 */
router.patch(
  '/:id/status',
  isAuthorized,
  validate(toggleAccountStatusSchema),
  userController.toggleAccountStatus
);

/**
 * @route   POST /api/v1/users/:id/unlock
 * @desc    Unlock user account
 * @access  Protected
 */
router.post(
  '/:id/unlock',
  isAuthorized,
  validate(unlockAccountSchema),
  userController.unlockAccount
);

export default router;
