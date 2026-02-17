import userService from './service-new.js';
import { apiError } from '../../../utils/apiErrorHandler.js';
import { MESSAGES } from '../../../constants/index.js';

class UserController {
  /**
   * Create a new user account
   */
  async createUser(req, res, next) {
    try {
      const { userId, ...userData } = req.body;
      const user = await userService.createUser(userData, userId);

      return res.status(201).json({
        isSuccess: true,
        message: 'User account created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users with unified endpoint
   * Supports: get by ID, username, email, employee, role, filters, pagination
   */
  async getUsers(req, res, next) {
    try {
      const {
        tenantId,
        id,
        username,
        email,
        employeeId,
        roleId,
        status,
        isAccountEnable,
        search,
        page,
        limit,
        sort
      } = req.query;

      // Get by ID
      if (id) {
        const user = await userService.getUserById(id, tenantId);
        return res.status(200).json({
          isSuccess: true,
          data: user
        });
      }

      // Get by username
      if (username) {
        const user = await userService.getUserByUsername(tenantId, username);
        return res.status(200).json({
          isSuccess: true,
          data: user
        });
      }

      // Get by email
      if (email) {
        const user = await userService.getUserByEmail(tenantId, email);
        return res.status(200).json({
          isSuccess: true,
          data: user
        });
      }

      // Get by employee
      if (employeeId) {
        const user = await userService.getUserByEmployee(tenantId, employeeId);
        return res.status(200).json({
          isSuccess: true,
          data: user
        });
      }

      // Get by role
      if (roleId) {
        const users = await userService.getUsersByRole(tenantId, roleId);
        return res.status(200).json({
          isSuccess: true,
          data: users,
          total: users.length
        });
      }

      // Search users
      if (search) {
        const users = await userService.searchUsers(tenantId, search, status);
        return res.status(200).json({
          isSuccess: true,
          data: users,
          total: users.length
        });
      }

      // Build filters
      const filters = { tenantId };
      if (status) filters.status = status;
      if (isAccountEnable !== undefined) filters.isAccountEnable = isAccountEnable;

      // Build options
      const options = {
        populate: ['employeeId', 'roleId'],
        sort: sort || 'username',
        select: '-password -resetToken -resetTokenExpiry'
      };

      // Get with pagination
      if (page && limit) {
        const result = await userService.getUsersWithPagination(
          filters,
          parseInt(page),
          parseInt(limit),
          options,
          tenantId
        );
        return res.status(200).json({
          isSuccess: true,
          ...result
        });
      }

      // Get all
      const users = await userService.getAllUsers(filters, options, tenantId);
      return res.status(200).json({
        isSuccess: true,
        data: users,
        total: users.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (traditional REST endpoint)
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;

      const user = await userService.getUserById(id, tenantId);

      return res.status(200).json({
        isSuccess: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, tenantId, ...updateData } = req.body;

      const user = await userService.updateUser(id, updateData, userId, tenantId);

      return res.status(200).json({
        isSuccess: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;

      await userService.deleteUser(id, tenantId);

      return res.status(200).json({
        isSuccess: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { oldPassword, newPassword, userId } = req.body;

      const user = await userService.changePassword(id, tenantId, oldPassword, newPassword, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Password changed successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password (admin function)
   */
  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { newPassword, userId } = req.body;

      const user = await userService.resetPassword(id, tenantId, newPassword, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Password reset successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role
   */
  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { roleId, userId } = req.body;

      const user = await userService.updateRole(id, tenantId, roleId, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle account status (enable/disable)
   */
  async toggleAccountStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { isAccountEnable, userId } = req.body;

      const user = await userService.toggleAccountStatus(id, tenantId, isAccountEnable, userId);

      return res.status(200).json({
        isSuccess: true,
        message: `User account ${isAccountEnable ? 'enabled' : 'disabled'} successfully`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlock user account
   */
  async unlockAccount(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { userId } = req.body;

      const user = await userService.unlockAccount(id, tenantId, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'User account unlocked successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
