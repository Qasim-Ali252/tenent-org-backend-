import authService from './service.js';
import { apiError } from '../../../utils/index.js';
import {
  validateGrantAccess,
  validateRegister,
  validateLogin,
  validateSetPassword,
  validateRefreshToken,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile
} from './validation.js';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

/**
 * Grant Access — Super Admin creates an admin account
 * POST /api/v1/auth/grant-access
 * Protected by x-super-admin-secret header
 */
export const grantAccess = async (req, res, next) => {
  try {
    const validationResult = validateGrantAccess(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'grantAccess'));
    }

    const result = await authService.grantAccess(req.body);

    return res.status(201).send({
      isSuccess: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('Error in grantAccess:', error);
    return next(apiError.internal(error, 'grantAccess'));
  }
};

/**
 * Set Password — Admin sets password for the first time
 * POST /api/v1/auth/set-password
 */
export const setPassword = async (req, res, next) => {
  try {
    const validationResult = validateSetPassword(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'setPassword'));
    }

    const result = await authService.setPassword(req.body);

    return res.status(200).send({
      isSuccess: true,
      message: result.message,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    console.error('Error in setPassword:', error);
    return next(apiError.internal(error, 'setPassword'));
  }
};

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export const register = async (req, res, next) => {
  try {
    // Validate input
    const validationResult = validateRegister(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'register'));
    }

    // Register user
    const result = await authService.register(req.body);

    return res.status(201).send({
      isSuccess: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in register:', error);
    return next(apiError.internal(error, 'register'));
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 * If requiresPasswordSetup = true  → frontend redirects to set-password page
 * If requiresPasswordSetup = false → normal login with tokens
 */
export const login = async (req, res, next) => {
  try {
    // Validate input
    const validationResult = validateLogin(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'login'));
    }

    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Login user
    const result = await authService.login(req.body, ipAddress);

    return res.status(200).send({
      isSuccess: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Error in login:', error);
    return next(apiError.internal(error, 'login'));
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(apiError.badRequest('User not authenticated', 'logout'));
    }

    // Logout user
    const result = await authService.logout(userId);

    return res.status(200).send({
      isSuccess: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in logout:', error);
    return next(apiError.internal(error, 'logout'));
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = async (req, res, next) => {
  try {
    // Validate input
    const validationResult = validateRefreshToken(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'refreshToken'));
    }

    // Refresh token
    const result = await authService.refreshAccessToken(req.body.refreshToken);

    return res.status(200).send({
      isSuccess: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in refreshToken:', error);
    return next(apiError.internal(error, 'refreshToken'));
  }
};

/**
 * Change password
 * POST /api/v1/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(apiError.badRequest('User not authenticated', 'changePassword'));
    }

    // Validate input
    const validationResult = validateChangePassword(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'changePassword'));
    }

    // Change password
    const result = await authService.changePassword(
      userId,
      req.body.currentPassword,
      req.body.newPassword
    );

    return res.status(200).send({
      isSuccess: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in changePassword:', error);
    return next(apiError.internal(error, 'changePassword'));
  }
};

/**
 * Forgot password
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    // Validate input
    const validationResult = validateForgotPassword(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'forgotPassword'));
    }

    // Generate reset token
    const result = await authService.forgotPassword(req.body.email);

    return res.status(200).send({
      isSuccess: true,
      message: result.message,
      resetToken: result.resetToken // Remove in production
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return next(apiError.internal(error, 'forgotPassword'));
  }
};

/**
 * Reset password
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    // Validate input
    const validationResult = validateResetPassword(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'resetPassword'));
    }

    // Reset password
    const result = await authService.resetPassword(
      req.body.resetToken,
      req.body.newPassword
    );

    return res.status(200).send({
      isSuccess: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return next(apiError.internal(error, 'resetPassword'));
  }
};

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(apiError.badRequest('User not authenticated', 'getCurrentUser'));
    }

    // Get user
    const user = await authService.getCurrentUser(userId);

    return res.status(200).send({
      isSuccess: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return next(apiError.internal(error, 'getCurrentUser'));
  }
};

/**
 * Update user profile
 * PUT /api/v1/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(apiError.badRequest('User not authenticated', 'updateProfile'));
    }

    // Validate input
    const validationResult = validateUpdateProfile(req.body);
    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'updateProfile'));
    }

    // Update profile
    const user = await authService.updateProfile(userId, req.body);

    return res.status(200).send({
      isSuccess: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return next(apiError.internal(error, 'updateProfile'));
  }
};

export default {
  grantAccess,
  setPassword,
  register,
  login,
  logout,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile
};
