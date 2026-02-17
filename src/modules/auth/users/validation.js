import Joi from 'joi';

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Create user validation
export const createUserSchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  employeeId: Joi.string().hex().length(24).required(),
  username: Joi.string().lowercase().pattern(/^[a-z0-9._-]+$/).min(3).max(50).required(),
  password: Joi.string().min(8).pattern(PASSWORD_REGEX).required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
    }),
  email: Joi.string().email().required(),
  roleId: Joi.string().hex().length(24).required(),
  isAccountEnable: Joi.boolean().default(true),
  userId: Joi.string().hex().length(24).required()
});

// Update user validation
export const updateUserSchema = Joi.object({
  username: Joi.string().lowercase().pattern(/^[a-z0-9._-]+$/).min(3).max(50),
  email: Joi.string().email(),
  roleId: Joi.string().hex().length(24),
  isAccountEnable: Joi.boolean(),
  userId: Joi.string().hex().length(24).required()
}).min(2); // At least userId + one field to update

// Get users query validation
export const getUsersQuerySchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  id: Joi.string().hex().length(24),
  username: Joi.string().lowercase(),
  email: Joi.string().email(),
  employeeId: Joi.string().hex().length(24),
  roleId: Joi.string().hex().length(24),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'ARCHIVED'),
  isAccountEnable: Joi.boolean(),
  search: Joi.string().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('username', '-username', 'email', '-email', 'createdAt', '-createdAt')
});

// Delete user validation
export const deleteUserSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
  tenantId: Joi.string().hex().length(24).required()
});

// Change password validation
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(PASSWORD_REGEX).required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
    }),
  userId: Joi.string().hex().length(24).required()
});

// Reset password validation
export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).pattern(PASSWORD_REGEX).required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
    }),
  userId: Joi.string().hex().length(24).required()
});

// Update role validation
export const updateRoleSchema = Joi.object({
  roleId: Joi.string().hex().length(24).required(),
  userId: Joi.string().hex().length(24).required()
});

// Toggle account status validation
export const toggleAccountStatusSchema = Joi.object({
  isAccountEnable: Joi.boolean().required(),
  userId: Joi.string().hex().length(24).required()
});

// Unlock account validation
export const unlockAccountSchema = Joi.object({
  userId: Joi.string().hex().length(24).required()
});

export default {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  deleteUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  updateRoleSchema,
  toggleAccountStatusSchema,
  unlockAccountSchema
};
