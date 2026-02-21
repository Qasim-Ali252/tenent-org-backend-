import { apiError } from '../utils/index.js'
import { RoleModel } from '../modules/auth/roles/model.js'

export const permissionGuard = (permissionKey) => {
    return async (req, res, next) => {
        try {
            // 0. Super Admin Secret Bypass (for bootstrap/setup)
            const secret = req.headers['x-super-admin-secret'];
            const expected = process.env.SUPER_ADMIN_SECRET;
            if (secret && expected && secret === expected) {
                return next();
            }

            const user = req.user
            if (!user) {
                return next(apiError.unauthorized('User not found in request'))
            }

            // Super Admin bypasses all checks (if he's identified by accountType or specific role)
            if (user.accountType === 'super-admin' || user.accountType === 'platform-owner') {
                return next()
            }

            if (!user.roleId) {
                return next(apiError.forbidden('Role not assigned to user'))
            }

            // Fetch role and populate permissions
            const role = await RoleModel.findById(user.roleId).populate('permissions')

            if (!role || !role.permissions) {
                return next(apiError.forbidden('Role or permissions not found'))
            }

            // 1. Check if user has specific permission key if provided
            if (permissionKey) {
                const hasKey = role.permissions.some(p => p.key === permissionKey)
                if (hasKey) return next()
            }

            // 2. Automated Path/Method Match (Enterprise standard)
            // Example: GET /api/v1/users/profile
            // req.baseUrl = /api/v1/users
            // req.path = /profile
            // We'll normalize the path for matching
            const fullPath = (req.baseUrl + req.path).replace(/\/$/, '') || '/'
            const method = req.method.toUpperCase()

            const hasAccess = role.permissions.some(p => {
                // Check path match
                const pathMatch = p.route && (
                    p.route === 'ALL' || 
                    p.route === '*' || 
                    fullPath.includes(p.route.replace(/\/$/, ''))
                )

                // Check method match
                const methodMatch = p.method === 'ALL' || p.method === method

                return pathMatch && methodMatch
            })

            if (hasAccess) {
                return next()
            }

            return next(apiError.forbidden('You do not have permission to perform this action'))
        } catch (error) {
            console.error('Permission Guard Error:', error)
            return next(apiError.internal('Permission validation failed'))
        }
    }
}
