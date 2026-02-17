import Joi from 'joi';

/**
 * Validation schemas for authentication endpoints
 */

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Register validation
export const validateRegister = (data) => {
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name cannot exceed 50 characters',
      'string.empty': 'Full name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email format',
      'string.empty': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(passwordRegex).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      'string.empty': 'Password is required'
    }),
    username: Joi.string().min(3).max(50).lowercase().pattern(/^[a-z0-9._-]+$/).required().messages({
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 50 characters',
      'string.pattern.base': 'Username can only contain lowercase letters, numbers, dots, underscores, and hyphens',
      'string.empty': 'Username is required'
    }),
    companyId: Joi.string().optional().allow(null).messages({
      'string.empty': 'Company ID cannot be empty'
    }),
    roleId: Joi.string().optional().allow(null).messages({
      'string.empty': 'Role ID cannot be empty'
    })
  });

  const result = schema.validate(data, { abortEarly: false });
  return {
    error: result?.error,
    msg: result?.error?.details?.map(d => d.message).join(', ')
  };
};

// Login validation
export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email format',
      'string.empty': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required'
    })
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

// Refresh token validation
export const validateRefreshToken = (data) => {
  const schema = Joi.object({
    refreshToken: Joi.string().required().messages({
      'string.empty': 'Refresh token is required'
    })
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

// Change password validation
export const validateChangePassword = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required().messages({
      'string.empty': 'Current password is required'
    }),
    newPassword: Joi.string().min(8).pattern(passwordRegex).required().messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      'string.empty': 'New password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Confirm password is required'
    })
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

// Forgot password validation
export const validateForgotPassword = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email format',
      'string.empty': 'Email is required'
    })
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

// Reset password validation
export const validateResetPassword = (data) => {
  const schema = Joi.object({
    resetToken: Joi.string().required().messages({
      'string.empty': 'Reset token is required'
    }),
    newPassword: Joi.string().min(8).pattern(passwordRegex).required().messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      'string.empty': 'New password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Confirm password is required'
    })
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

// Update profile validation
export const validateUpdateProfile = (data) => {
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name cannot exceed 50 characters'
    }),
    username: Joi.string().min(3).max(50).lowercase().pattern(/^[a-z0-9._-]+$/).optional().messages({
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 50 characters',
      'string.pattern.base': 'Username can only contain lowercase letters, numbers, dots, underscores, and hyphens'
    })
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

export default {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile
};
