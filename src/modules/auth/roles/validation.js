import Joi from 'joi';

// Role scopes
const ROLE_SCOPES = ['GLOBAL', 'BRANCH'];

// Create role validation
export const createRoleSchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  roleKey: Joi.string().uppercase().pattern(/^[A-Z_]+$/).max(50).required(),
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500).allow('', null),
  permissions: Joi.array().items(Joi.string().hex().length(24)),
  scope: Joi.string().valid(...ROLE_SCOPES).default('BRANCH'),
  isSystemRole: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  userId: Joi.string().hex().length(24).required()
});

// Update role validation
export const updateRoleSchema = Joi.object({
  roleKey: Joi.string().uppercase().pattern(/^[A-Z_]+$/).max(50),
  name: Joi.string().max(100),
  description: Joi.string().max(500).allow('', null),
  permissions: Joi.array().items(Joi.string().hex().length(24)),
  scope: Joi.string().valid(...ROLE_SCOPES),
  isActive: Joi.boolean(),
  userId: Joi.string().hex().length(24).required()
}).min(2); // At least userId + one field to update

// Get roles query validation
export const getRolesQuerySchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  id: Joi.string().hex().length(24),
  roleKey: Joi.string().uppercase(),
  scope: Joi.string().valid(...ROLE_SCOPES),
  isActive: Joi.boolean(),
  isSystemRole: Joi.boolean(),
  search: Joi.string().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('name', '-name', 'roleKey', '-roleKey', 'createdAt', '-createdAt')
});

// Delete role validation
export const deleteRoleSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
  tenantId: Joi.string().hex().length(24).required()
});

// Add permission validation
export const addPermissionSchema = Joi.object({
  permissionId: Joi.string().hex().length(24).required(),
  userId: Joi.string().hex().length(24).required()
});

// Remove permission validation
export const removePermissionSchema = Joi.object({
  permissionId: Joi.string().hex().length(24).required(),
  userId: Joi.string().hex().length(24).required()
});

// Set permissions validation
export const setPermissionsSchema = Joi.object({
  permissions: Joi.array().items(Joi.string().hex().length(24)).required(),
  userId: Joi.string().hex().length(24).required()
});

// Clone role validation
export const cloneRoleSchema = Joi.object({
  newRoleKey: Joi.string().uppercase().pattern(/^[A-Z_]+$/).max(50).required(),
  newName: Joi.string().max(100).required(),
  userId: Joi.string().hex().length(24).required()
});

export default {
  createRoleSchema,
  updateRoleSchema,
  getRolesQuerySchema,
  deleteRoleSchema,
  addPermissionSchema,
  removePermissionSchema,
  setPermissionsSchema,
  cloneRoleSchema
};
