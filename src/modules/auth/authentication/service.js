import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../../users/model.js'; // Use the main user model from src/modules/users
import { generateToken, generateRefreshToken } from '../../../utils/token.js';
import { apiError } from '../../../utils/index.js';
import { config } from '../../../config/index.js';

/**
 * Authentication Service
 * Handles user registration, login, logout, and token management
 */
class AuthenticationService {
  
  /**
   * Register new user
   */
  async register(data) {
    const { email, password, fullName, companyId, roleId } = data;

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      throw apiError.badRequest('Email already registered');
    }

    // Create user
    const user = new UserModel({
      fullName,
      email: email.toLowerCase(),
      username: email.toLowerCase(), // Use email as username since it's required in model
      password, // Will be hashed by pre-save hook
      companyId: companyId || null,
      roleId: roleId || null
    });

    await user.save();

    // Generate tokens
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Return user without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      accessToken,
      refreshToken
    };
  }

  /**
   * Login user
   */
  async login(data, ipAddress) {
    const { email, password } = data;

    // Find user with password
    const user = await UserModel.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      throw apiError.badRequest('Invalid email or password');
    }

    // Check if account is enabled
    if (!user.isAccountEnable) {
      throw apiError.badRequest('Account is disabled');
    }

    // Verify password using the model's checkPassword method
    const isPasswordValid = await user.checkPassword(password);
    
    if (!isPasswordValid) {
      throw apiError.badRequest('Invalid email or password');
    }

    // Generate tokens
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Return user without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.resetToken;
    delete userResponse.resetTokenExpiry;

    return {
      user: userResponse,
      accessToken,
      refreshToken
    };
  }

  /**
   * Logout user
   */
  async logout(userId) {
    const user = await UserModel.findById(userId);
    
    if (!user) {
      throw apiError.notFound('User not found');
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    const decoded = await this.verifyRefreshToken(refreshToken);

    // Find user
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      throw apiError.badRequest('Invalid refresh token');
    }

    // Check if account is enabled
    if (!user.isAccountEnable) {
      throw apiError.badRequest('Account is disabled');
    }

    // Generate new access token
    const accessToken = await this.generateAccessToken(user);

    // Optionally rotate refresh token
    const newRefreshToken = await this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw apiError.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.checkPassword(currentPassword);
    
    if (!isPasswordValid) {
      throw apiError.badRequest('Current password is incorrect');
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    return { message: 'Password changed successfully' };
  }

  /**
   * Forgot password - Generate reset token
   */
  async forgotPassword(email) {
    const user = await UserModel.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, reset instructions have been sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // TODO: Send email with reset link
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: 'If email exists, reset instructions have been sent',
      resetToken // Remove this in production, only for testing
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetToken, newPassword) {
    const user = await UserModel.findOne({
      resetToken: resetToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      throw apiError.badRequest('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    user.resetToken = '';
    user.resetTokenExpiry = null;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId) {
    const user = await UserModel.findById(userId)
      .populate('companyId')
      .populate('roleId')
      .select('-password -resetToken -resetTokenExpiry');

    if (!user) {
      throw apiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw apiError.notFound('User not found');
    }

    // Only allow updating certain fields
    const allowedFields = ['fullName'];
    
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        user[key] = data[key];
      }
    });

    await user.save();

    const updatedUser = await UserModel.findById(userId)
      .populate('companyId')
      .populate('roleId')
      .select('-password -resetToken -resetTokenExpiry');

    return updatedUser;
  }

  /**
   * Generate access token
   */
  async generateAccessToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      companyId: user.companyId,
      roleId: user.roleId,
      type: 'access'
    };

    return await generateToken(payload);
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(user) {
    const payload = {
      userId: user._id,
      type: 'refresh'
    };

    return await generateRefreshToken(payload);
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token) {
    try {
      const { verifyJwtToken } = await import('../../../utils/token.js');
      const decoded = await verifyJwtToken(token);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw apiError.badRequest('Invalid or expired refresh token');
    }
  }
}

export default new AuthenticationService();
