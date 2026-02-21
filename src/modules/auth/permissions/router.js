import express from 'express';
import permissionController from './controller.js';
import isAuthorized from '../../../middleware/auth.js';
import { permissionGuard } from '../../../middleware/permissionGuard.js';

const router = express.Router();

/**
 * Special Guard for Seeding: Allows access if EITHER:
 * 1. Valid Super Admin Secret is provided in headers
 * 2. User is authenticated AND (is an 'admin' or has 'PERM_ADMIN_ALL' permission)
 */
const seedGuard = async (req, res, next) => {
  const secret = req.headers['x-super-admin-secret'];
  const expected = process.env.SUPER_ADMIN_SECRET;

  // 1. If secret matches, bypass authentication entirely
  if (secret && expected && secret === expected) {
    return next();
  }

  // 2. Otherwise, check authentication
  return isAuthorized(req, res, async (authErr) => {
    if (authErr) return next(authErr);
    try {
        const user = req.user;
        
        // 3. If they are an Admin profile, bypass RBAC for this one specific call 
        // to bootstrap the system initially.
        if (user && (user.accountType === 'admin' || user.accountType === 'super-admin' || user.accountType === 'platform-owner')) {
          return next();
        }

        // 4. Default: check specific permission key
        return permissionGuard('PERM_ADMIN_ALL')(req, res, next);
    } catch (err) {
        next(err);
    }
  });
};

/**
 * @route   POST /api/v1/permissions/seed
 * @desc    Bulk create/update permissions
 * @access  Secret Header OR Admin Token
 */
router.post(
  '/seed',
  seedGuard,
  permissionController.seedPermissions
);

/**
 * @route   GET /api/v1/permissions/grouped
 * @desc    Get permissions grouped by module
 * @access  Protected
 */
router.get(
  '/grouped',
  isAuthorized,
  permissionController.getPermissionsGrouped
);

/**
 * @route   POST /api/v1/permissions
 * @desc    Create a new permission
 * @access  Protected
 */
router.post(
  '/',
  isAuthorized,
  permissionGuard('PERM_ADMIN_ALL'),
  permissionController.createPermission
);

/**
 * @route   GET /api/v1/permissions
 * @desc    Get permissions
 * @access  Protected
 */
router.get(
  '/',
  isAuthorized,
  permissionController.getPermissions
);

export default router;
