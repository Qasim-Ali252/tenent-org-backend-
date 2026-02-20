import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../../users/model.js'; // Use the main user model from src/modules/users
import RoleModel from '../../users/roles-permissions/model.js';
import { generateToken, generateRefreshToken } from '../../../utils/token.js';
import { apiError } from '../../../utils/index.js';
import { config } from '../../../config/index.js';


class AuthenticationService {

  /**
   * Grant Access — Super Admin creates an admin account
   * Admin can be created with a temporary password or no password.
   */
  async grantAccess(data) {
    const { email, fullName, temporaryPassword } = data;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw apiError.badRequest('An account with this email already exists');
    }

    // Find or create the default 'admin' role
    let adminRole = await RoleModel.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = new RoleModel({ name: 'admin', permissions: [] });
      await adminRole.save();
    }

    // Create admin account
    const user = new UserModel({
      fullName,
      email: email.toLowerCase(),
      username: email.toLowerCase(),
      password: temporaryPassword || null,
      isPasswordSet: !!temporaryPassword, // true if temporaryPassword provided
      isTemporaryPassword: !!temporaryPassword, // true if temporaryPassword provided
      accountType: 'admin',
      roleId: adminRole._id,
      isAccountEnable: true
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      message: temporaryPassword 
        ? `Admin account created with temporary password. ${email} must change it on login.`
        : `Admin account created. ${email} can now log in and set their password.`,
      user: userResponse
    };
  }

  /**
   * Register new user (kept for backward compatibility)
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
      username: email.toLowerCase(), 
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
   * Flow:
   *   1. Email not found       → Access Denied
   *   2. Account disabled      → Account Disabled
   *   3. isPasswordSet = false → requiresPasswordSetup (admin without password)
   *   4. isTemporaryPassword = true → Verify password → requiresPasswordChange (force new password)
   *   5. Normal login          → Verify password → Success
   */
  async login(data, ipAddress) {
    const { email, password } = data;

    // Step 1: Find user
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw apiError.forbidden('Access denied. No account found for this email. Contact your Super Admin.');
    }

    // Step 2: Check if account is enabled
    if (!user.isAccountEnable) {
      throw apiError.badRequest('Account is disabled. Contact your Super Admin.');
    }

    // Step 3: First-time login — password not set at all (Admin starts with null password)
    if (!user.isPasswordSet) {
      return {
        requiresPasswordSetup: true,
        message: 'Please set your password to continue.',
        email: user.email
      };
    }

    // Step 4: Verify password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      throw apiError.badRequest('Invalid email or password');
    }

    // Step 5: Temporary password check (Super Admin set a temp password)
    if (user.isTemporaryPassword) {
      return {
        requiresPasswordChange: true,
        message: 'Your temporary password is correct. Please set a permanent password to continue.',
        email: user.email
      };
    }

    // Normal Success Login
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Return user without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.resetToken;
    delete userResponse.resetTokenExpiry;

    return {
      requiresPasswordSetup: false,
      requiresPasswordChange: false,
      user: userResponse,
      accessToken,
      refreshToken
    };
  }

  /**
   * Set Password — Admin sets password for the first time
   * Resets both isPasswordSet and isTemporaryPassword flags.
   */
  async setPassword(data) {
    const { email, newPassword } = data;

    // Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw apiError.notFound('No account found for this email');
    }

    if (!user.isAccountEnable) {
      throw apiError.badRequest('Account is disabled');
    }

    // Use this endpoint for either first-time setup OR replacing a temporary password
    if (user.isPasswordSet && !user.isTemporaryPassword) {
      throw apiError.badRequest('Password is already set. Use the change-password endpoint instead.');
    }

    // Set password and mark as permanent
    user.password = newPassword; 
    user.isPasswordSet = true;
    user.isTemporaryPassword = false;
    await user.save();

    // Auto-login after setting password — generate tokens
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.resetToken;
    delete userResponse.resetTokenExpiry;

    return {
      message: 'Permanent password set successfully. You are now logged in.',
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
