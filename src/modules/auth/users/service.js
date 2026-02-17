import GlobalService from '../../../utils/globalService.js';
import { UserModel } from '../../users/model.js'; // Use the main user model
import { apiError, generateToken, generateRefreshToken } from '../../../utils/index.js';

/**
 * UserService - Service layer for user operations
 * Extends GlobalService for common CRUD operations
 * UPDATED: Now includes userId parameters for audit trail
 */
class UserService extends GlobalService {
  constructor() {
    super(UserModel);
  }

 
  async getUserById(userId, populateFields = 'employeeId roleId', tenantId) {
    return await this.getById(
      userId,
      { populate: populateFields },
      tenantId
    );
  }

 
  async getByUsername(tenantId, username) {
    return await this.getOneByConditions(
      { username: username.toLowerCase() },
      { populate: 'employeeId roleId' },
      tenantId
    );
  }

  
  async getByEmail(tenantId, email) {
    return await this.getOneByConditions(
      { email: email.toLowerCase() },
      { populate: 'employeeId roleId' },
      tenantId
    );
  }

  
  async getByRole(tenantId, roleId, status = 'ACTIVE') {
    const filters = { roleId };
    if (status) filters.status = status;

    return await this.getAll(
      filters,
      { sort: { username: 1 }, populate: 'employeeId roleId', select: '-passwordHash -pin -refreshToken' },
      tenantId
    );
  }

 
  async getAllUsers(tenantId, page = 1, limit = 10, filters = {}) {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.roleId) query.roleId = filters.roleId;
    if (filters.search) {
      query.$or = [
        { username: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const result = await this.getAllWithPagination(
      query,
      page,
      limit,
      { 
        sort: { username: 1 }, 
        populate: 'employeeId roleId',
        select: '-passwordHash -pin -refreshToken'
      },
      tenantId
    );

    return {
      users: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  }

 
  async createUser(tenantId, data, creatingUserId) {  // ← UPDATED: Added creatingUserId
    // Check if username already exists
    const usernameExists = await this.exists(
      { username: data.username.toLowerCase() },
      tenantId
    );

    if (usernameExists) {
      throw apiError.badRequest('Username already exists');
    }

    // Check if email already exists
    const emailExists = await this.exists(
      { email: data.email.toLowerCase() },
      tenantId
    );

    if (emailExists) {
      throw apiError.badRequest('Email already exists');
    }

    // Check if employee already has a user account
    if (data.employeeId) {
      const employeeExists = await this.exists(
        { employeeId: data.employeeId },
        tenantId
      );

      if (employeeExists) {
        throw apiError.badRequest('Employee already has a user account');
      }
    }

    return await this.create({
      ...data,
      tenantId,
      username: data.username.toLowerCase(),
      email: data.email.toLowerCase(),
      passwordHash: data.password, // Will be hashed by pre-save hook
      addedUser: creatingUserId,      // ← UPDATED: Added audit field
      modifiedUser: creatingUserId    // ← UPDATED: Added audit field
    }, { populate: 'employeeId roleId' });
  }

  
  async updateUser(userId, tenantId, data, modifyingUserId) {  // ← UPDATED: Added modifyingUserId
    // If updating username, check uniqueness
    if (data.username) {
      const existing = await this.getOneByConditions(
        { username: data.username.toLowerCase(), _id: { $ne: userId } },
        {},
        tenantId
      );

      if (existing) {
        throw apiError.badRequest('Username already exists');
      }
      data.username = data.username.toLowerCase();
    }

    // If updating email, check uniqueness
    if (data.email) {
      const existing = await this.getOneByConditions(
        { email: data.email.toLowerCase(), _id: { $ne: userId } },
        {},
        tenantId
      );

      if (existing) {
        throw apiError.badRequest('Email already exists');
      }
      data.email = data.email.toLowerCase();
    }

    // If updating password, hash it
    if (data.password) {
      data.passwordHash = data.password;
      delete data.password;
    }

    return await this.update(
      userId,
      {
        ...data,
        modifiedUser: modifyingUserId  // ← UPDATED: Added audit field
      },
      { populate: 'employeeId roleId' },
      tenantId
    );
  }

  
  async updateStatus(userId, tenantId, status, modifyingUserId) {  // ← UPDATED: Added modifyingUserId
    return await this.update(
      userId,
      { 
        status,
        modifiedUser: modifyingUserId  // ← UPDATED: Added audit field
      },
      { populate: 'employeeId roleId' },
      tenantId
    );
  }

  
  async updateRole(userId, tenantId, roleId, modifyingUserId) {  // ← UPDATED: Added modifyingUserId
    return await this.update(
      userId,
      { 
        roleId,
        modifiedUser: modifyingUserId  // ← UPDATED: Added audit field
      },
      { populate: 'employeeId roleId' },
      tenantId
    );
  }

  
  async changePassword(userId, tenantId, oldPassword, newPassword, modifyingUserId) {  // ← UPDATED: Added modifyingUserId
    const user = await this.Model.findOne({ _id: userId, tenantId }).select('+passwordHash');
    
    if (!user) {
      throw apiError.notFound('User not found');
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw apiError.badRequest('Current password is incorrect');
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    user.modifiedUser = modifyingUserId;  // ← UPDATED: Added audit field
    await user.save();
    
    return user.toJSON();
  }

 
  async resetPassword(userId, tenantId, newPassword, modifyingUserId) {  // ← UPDATED: Added modifyingUserId
    const user = await this.Model.findOne({ _id: userId, tenantId });
    
    if (!user) {
      throw apiError.notFound('User not found');
    }

    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.modifiedUser = modifyingUserId;  // ← UPDATED: Added audit field
    await user.save();
    
    return user.toJSON();
  }

  
  async setPin(userId, tenantId, pin, modifyingUserId) {  // ← UPDATED: Added modifyingUserId
    const user = await this.Model.findOne({ _id: userId, tenantId });
    
    if (!user) {
      throw apiError.notFound('User not found');
    }

    user.pin = pin; // Will be hashed by pre-save hook
    user.modifiedUser = modifyingUserId;  // ← UPDATED: Added audit field
    await user.save();
    
    return user.toJSON();
  }

 
  async verifyPin(userId, tenantId, pin) {
    const user = await this.Model.findOne({ _id: userId, tenantId }).select('+pin');
    
    if (!user) {
      throw apiError.notFound('User not found');
    }

    return await user.comparePin(pin);
  }

 
  async login(tenantId, usernameOrEmail, password, ipAddress) {
    // Find user by username or email
    const user = await this.Model.findOne({
      tenantId,
      $or: [
        { username: usernameOrEmail.toLowerCase() },
        { email: usernameOrEmail.toLowerCase() }
      ]
    })
    .select('+passwordHash')
    .populate('employeeId roleId');

    if (!user) {
      throw apiError.badRequest('Invalid credentials');
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      throw apiError.forbidden('Account is locked. Please try again later.');
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      throw apiError.forbidden('Account is not active');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementFailedAttempts();
      throw apiError.badRequest('Invalid credentials');
    }

    // Update last login
    await user.updateLastLogin(ipAddress);

    // Generate tokens
    const token = await generateToken({ 
      userId: user._id, 
      tenantId: user.tenantId,
      roleId: user.roleId 
    });
    
    const refreshToken = await generateRefreshToken({ 
      userId: user._id, 
      tenantId: user.tenantId 
    });

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Remove sensitive data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.pin;
    delete userObj.refreshToken;

    return {
      user: userObj,
      token,
      refreshToken
    };
  }

 
  async deleteUser(userId, tenantId, modifyingUserId) {  // ← UPDATED: Added modifyingUserId
    return await this.update(
      userId,
      { 
        status: 'INACTIVE',
        modifiedUser: modifyingUserId  // ← UPDATED: Added audit field
      },
      {},
      tenantId
    );
  }

  
  async hardDeleteUser(userId, tenantId) {
    return await this.hardDeleteOne(userId, tenantId);
  }

  
  async countUsers(tenantId, condition = {}) {
    return await this.countDocuments(condition, tenantId);
  }
}

// Export singleton instance
export default new UserService();
