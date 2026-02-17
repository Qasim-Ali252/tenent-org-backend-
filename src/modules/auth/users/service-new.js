import GlobalService from '../../../utils/globalService.js';
import UserModel from './model.js'; // Use the new user model
import { apiError } from '../../../utils/apiErrorHandler.js';
import { MESSAGES } from '../../../constants/index.js';

class UserService extends GlobalService {
  constructor() {
    super(UserModel);
  }

  /**
   * Create a new user account
   * @param {Object} data - User data
   * @param {String} userId - User ID creating the account
   * @returns {Promise<Object>} Created user
   */
  async createUser(data, userId) {
    try {
      // Set audit fields
      data.addedUser = userId;
      data.modifiedUser = userId;

      const user = await this.create(data, {
        populate: ['employeeId', 'roleId']
      });

      // Remove password from response
      const userObj = { ...user };
      delete userObj.password;
      delete userObj.resetToken;

      return userObj;
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.CREATE_FAILED);
    }
  }

  /**
   * Get user by ID
   * @param {String} id - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} User
   */
  async getUserById(id, tenantId) {
    try {
      const user = await this.getById(
        id,
        {
          populate: ['employeeId', 'roleId'],
          select: '-password -resetToken -resetTokenExpiry'
        },
        tenantId
      );

      if (!user) {
        throw apiError.notFound('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Array>} Users
   */
  async getAllUsers(filters, options, tenantId) {
    try {
      // Always exclude password
      if (!options.select) {
        options.select = '-password -resetToken -resetTokenExpiry';
      }
      return await this.getAll(filters, options, tenantId);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Get users with pagination
   * @param {Object} filters - Query filters
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {Object} options - Query options
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Paginated users
   */
  async getUsersWithPagination(filters, page, limit, options, tenantId) {
    try {
      // Always exclude password
      if (!options.select) {
        options.select = '-password -resetToken -resetTokenExpiry';
      }
      return await this.getAllWithPagination(filters, page, limit, options, tenantId);
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Update user
   * @param {String} id - User ID
   * @param {Object} updateData - Update data
   * @param {String} userId - User ID updating the user
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(id, updateData, userId, tenantId) {
    try {
      // Set modified user
      updateData.modifiedUser = userId;

      // Don't allow password update through this method
      if (updateData.password) {
        delete updateData.password;
      }

      const user = await this.update(
        id,
        updateData,
        {
          populate: ['employeeId', 'roleId'],
          select: '-password -resetToken -resetTokenExpiry'
        },
        tenantId
      );

      return user;
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.UPDATE_FAILED);
    }
  }

  /**
   * Delete user (soft delete)
   * @param {String} id - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Number>} Deleted count
   */
  async deleteUser(id, tenantId) {
    try {
      return await this.deleteOne(id, tenantId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by username
   * @param {String} tenantId - Tenant ID
   * @param {String} username - Username
   * @returns {Promise<Object>} User
   */
  async getUserByUsername(tenantId, username) {
    try {
      const user = await UserModel.findByUsername(tenantId, username);
      
      if (!user) {
        throw apiError.notFound('User not found');
      }

      // Remove password
      const userObj = user.toJSON();
      delete userObj.password;
      delete userObj.resetToken;

      return userObj;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {String} tenantId - Tenant ID
   * @param {String} email - Email
   * @returns {Promise<Object>} User
   */
  async getUserByEmail(tenantId, email) {
    try {
      const user = await UserModel.findByEmail(tenantId, email);
      
      if (!user) {
        throw apiError.notFound('User not found');
      }

      // Remove password
      const userObj = user.toJSON();
      delete userObj.password;
      delete userObj.resetToken;

      return userObj;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by employee
   * @param {String} tenantId - Tenant ID
   * @param {String} employeeId - Employee ID
   * @returns {Promise<Object>} User
   */
  async getUserByEmployee(tenantId, employeeId) {
    try {
      const user = await UserModel.findByEmployee(tenantId, employeeId);
      
      if (!user) {
        throw apiError.notFound('User not found');
      }

      // Remove password
      const userObj = user.toJSON();
      delete userObj.password;
      delete userObj.resetToken;

      return userObj;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {String} tenantId - Tenant ID
   * @param {String} roleId - Role ID
   * @returns {Promise<Array>} Users
   */
  async getUsersByRole(tenantId, roleId) {
    try {
      const users = await UserModel.findByRole(tenantId, roleId);
      
      // Remove passwords
      return users.map(user => {
        const userObj = user.toJSON();
        delete userObj.password;
        delete userObj.resetToken;
        return userObj;
      });
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }

  /**
   * Change password
   * @param {String} id - User ID
   * @param {String} tenantId - Tenant ID
   * @param {String} oldPassword - Old password
   * @param {String} newPassword - New password
   * @param {String} userId - User ID making the change
   * @returns {Promise<Object>} Updated user
   */
  async changePassword(id, tenantId, oldPassword, newPassword, userId) {
    try {
      const user = await UserModel.findOne({ _id: id, tenantId });
      
      if (!user) {
        throw apiError.notFound('User not found');
      }

      // Verify old password
      const isValid = await user.checkPassword(oldPassword);
      if (!isValid) {
        throw apiError.badRequest('Current password is incorrect');
      }

      // Update password
      user.password = newPassword; // Will be hashed by pre-save hook
      user.modifiedUser = userId;
      await user.save();

      // Remove password from response
      const userObj = user.toJSON();
      delete userObj.password;
      delete userObj.resetToken;

      return userObj;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password (admin function)
   * @param {String} id - User ID
   * @param {String} tenantId - Tenant ID
   * @param {String} newPassword - New password
   * @param {String} userId - User ID making the change
   * @returns {Promise<Object>} Updated user
   */
  async resetPassword(id, tenantId, newPassword, userId) {
    try {
      const user = await UserModel.findOne({ _id: id, tenantId });
      
      if (!user) {
        throw apiError.notFound('User not found');
      }

      // Update password
      user.password = newPassword; // Will be hashed by pre-save hook
      user.resetToken = null;
      user.resetTokenExpiry = null;
      user.modifiedUser = userId;
      await user.save();

      // Reset login attempts
      await user.resetLoginAttempts();

      // Remove password from response
      const userObj = user.toJSON();
      delete userObj.password;
      delete userObj.resetToken;

      return userObj;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unlock user account
   * @param {String} id - User ID
   * @param {String} tenantId - Tenant ID
   * @param {String} userId - User ID making the change
   * @returns {Promise<Object>} Updated user
   */
  async unlockAccount(id, tenantId, userId) {
    try {
      const user = await UserModel.findOne({ _id: id, tenantId });
      
      if (!user) {
        throw apiError.notFound('User not found');
      }

      await user.resetLoginAttempts();
      user.modifiedUser = userId;
      await user.save();

      // Remove password from response
      const userObj = user.toJSON();
      delete userObj.password;
      delete userObj.resetToken;

      return userObj;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user role
   * @param {String} id - User ID
   * @param {String} tenantId - Tenant ID
   * @param {String} roleId - New role ID
   * @param {String} userId - User ID making the change
   * @returns {Promise<Object>} Updated user
   */
  async updateRole(id, tenantId, roleId, userId) {
    try {
      const user = await this.update(
        id,
        {
          roleId,
          modifiedUser: userId
        },
        {
          populate: ['employeeId', 'roleId'],
          select: '-password -resetToken -resetTokenExpiry'
        },
        tenantId
      );

      return user;
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.UPDATE_FAILED);
    }
  }

  /**
   * Enable/disable user account
   * @param {String} id - User ID
   * @param {String} tenantId - Tenant ID
   * @param {Boolean} isEnabled - Enable or disable
   * @param {String} userId - User ID making the change
   * @returns {Promise<Object>} Updated user
   */
  async toggleAccountStatus(id, tenantId, isEnabled, userId) {
    try {
      const user = await this.update(
        id,
        {
          isAccountEnable: isEnabled,
          modifiedUser: userId
        },
        {
          populate: ['employeeId', 'roleId'],
          select: '-password -resetToken -resetTokenExpiry'
        },
        tenantId
      );

      return user;
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.UPDATE_FAILED);
    }
  }

  /**
   * Search users
   * @param {String} tenantId - Tenant ID
   * @param {String} searchTerm - Search term
   * @param {String} status - Status filter
   * @returns {Promise<Array>} Users
   */
  async searchUsers(tenantId, searchTerm, status = 'ACTIVE') {
    try {
      const query = {
        tenantId,
        $or: [
          { username: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (status) query.status = status;

      const users = await UserModel.find(query)
        .populate('employeeId')
        .populate('roleId')
        .select('-password -resetToken -resetTokenExpiry')
        .sort({ username: 1 });

      return users.map(u => u.toJSON());
    } catch (error) {
      throw apiError.badRequest(error.message || MESSAGES.FETCH_FAILED);
    }
  }
}

export default new UserService();
