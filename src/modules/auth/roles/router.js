import express from 'express';
import roleController from './controller.js';
import { isAuthorized } from '../../../middleware/auth.js';
import { validate } from '../../../validation/index.js';
import {
  createRoleSchema,
  updateRoleSchema,
  getRolesQuerySchema,
  deleteRoleSchema,
  addPermissionSchema,
  removePermissionSchema,
  setPermissionsSchema,
  cloneRoleSchema
} from './validation.js';

const router = express.Router();

/**
 * @route   POST /api/v1/roles
 * @desc    Create a new role
 * @access  Protected
 */
router.post(
  '/',
  isAuthorized,
  validate(createRoleSchema),
  roleController.createRole
);

/**
 * @route   GET /api/v1/roles
 * @desc    Get roles (unified endpoint with query parameters)
 * @query   tenantId, id, roleKey, scope, isActive, isSystemRole, search, page, limit, sort
 * @access  Protected
 */
router.get(
  '/',
  isAuthorized,
  validate(getRolesQuerySchema, 'query'),
  roleController.getRoles
);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Get role by ID (traditional REST style)
 * @access  Protected
 */
router.get(
  '/:id',
  isAuthorized,
  roleController.getRoleById
);

/**
 * @route   PUT /api/v1/roles/:id
 * @desc    Update role
 * @access  Protected
 */
router.put(
  '/:id',
  isAuthorized,
  validate(updateRoleSchema),
  roleController.updateRole
);

/**
 * @route   DELETE /api/v1/roles/:id
 * @desc    Delete role (soft delete)
 * @access  Protected
 */
router.delete(
  '/:id',
  isAuthorized,
  validate(deleteRoleSchema, 'query'),
  roleController.deleteRole
);

/**
 * @route   POST /api/v1/roles/:id/permissions
 * @desc    Add permission to role
 * @access  Protected
 */
router.post(
  '/:id/permissions',
  isAuthorized,
  validate(addPermissionSchema),
  roleController.addPermission
);

/**
 * @route   DELETE /api/v1/roles/:id/permissions
 * @desc    Remove permission from role
 * @access  Protected
 */
router.delete(
  '/:id/permissions',
  isAuthorized,
  validate(removePermissionSchema),
  roleController.removePermission
);

/**
 * @route   PUT /api/v1/roles/:id/permissions
 * @desc    Set permissions for role (replace all)
 * @access  Protected
 */
router.put(
  '/:id/permissions',
  isAuthorized,
  validate(setPermissionsSchema),
  roleController.setPermissions
);

/**
 * @route   POST /api/v1/roles/:id/clone
 * @desc    Clone role
 * @access  Protected
 */
router.post(
  '/:id/clone',
  isAuthorized,
  validate(cloneRoleSchema),
  roleController.cloneRole
);

export default router;
