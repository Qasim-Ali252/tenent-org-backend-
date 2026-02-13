import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from '../../../config/index.js';
import globalSchema from '../../../utils/globalSchema.js';
import {
  tenantIdField,
  createReferenceField,
  emailField,
  schemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// User schema - for login credentials
const userSchema = new Schema({
  tenantId: tenantIdField,
  employeeId: createReferenceField('Employee', 'Employee ID'),
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
    match: [/^[a-z0-9._-]+$/, 'Username can only contain lowercase letters, numbers, dots, underscores, and hyphens']
  },
  email: emailField,
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false // Don't include password in queries by default
  },
  roleId: createReferenceField('Role', 'Role ID'),
  pin: {
    type: String,
    select: false, // 4-6 digit PIN for quick POS access
    match: [/^[0-9]{4,6}$/, 'PIN must be 4-6 digits']
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLoginIP: {
    type: String,
    default: null
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  refreshToken: {
    type: String,
    select: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  }
  // status, addedUser, modifiedUser, and display dates come from globalSchema
}, schemaOptions);

// Add global schema fields
userSchema.add(globalSchema);

// Compound indexes
userSchema.index({ tenantId: 1, username: 1 }, { unique: true });
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
userSchema.index({ tenantId: 1, status: 1 });
userSchema.index({ tenantId: 1, roleId: 1 });

// Virtual to populate employee details
userSchema.virtual('employee', {
  ref: 'Employee',
  localField: 'employeeId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate role details
userSchema.virtual('role', {
  ref: 'Role',
  localField: 'roleId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(config.saltWorkFactor || 10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    this.passwordChangedAt = Date.now();
    next();
  } catch (error) {
    return next(error);
  }
});

// Pre-save hook to hash PIN
userSchema.pre('save', async function(next) {
  if (!this.isModified('pin') || !this.pin) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(config.saltWorkFactor || 10);
    this.pin = await bcrypt.hash(this.pin, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Need to explicitly select passwordHash since it's excluded by default
    const user = await this.constructor.findById(this._id).select('+passwordHash');
    return await bcrypt.compare(candidatePassword, user.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to compare PIN
userSchema.methods.comparePin = async function(candidatePin) {
  try {
    const user = await this.constructor.findById(this._id).select('+pin');
    if (!user.pin) return false;
    return await bcrypt.compare(candidatePin, user.pin);
  } catch (error) {
    throw new Error('PIN comparison failed');
  }
};

// Instance method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.accountLockedUntil && this.accountLockedUntil > Date.now();
};

// Instance method to increment failed login attempts
userSchema.methods.incrementFailedAttempts = async function() {
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
    this.status = 'LOCKED';
  }
  
  await this.save();
};

// Instance method to reset failed login attempts
userSchema.methods.resetFailedAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  if (this.status === 'LOCKED') {
    this.status = 'ACTIVE';
  }
  await this.save();
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function(ipAddress) {
  this.lastLoginAt = Date.now();
  this.lastLoginIP = ipAddress;
  await this.resetFailedAttempts();
};

// Static method to find user by username
userSchema.statics.findByUsername = function(tenantId, username) {
  return this.findOne({ 
    tenantId, 
    username: username.toLowerCase()
  })
  .populate('employeeId')
  .populate('roleId');
};

// Static method to find user by email
userSchema.statics.findByEmail = function(tenantId, email) {
  return this.findOne({ 
    tenantId, 
    email: email.toLowerCase()
  })
  .populate('employeeId')
  .populate('roleId');
};

// Static method to find users by role
userSchema.statics.findByRole = function(tenantId, roleId, status = 'ACTIVE') {
  const query = { tenantId, roleId };
  if (status) query.status = status;
  return this.find(query)
    .populate('employeeId')
    .populate('roleId')
    .sort({ username: 1 });
};

// Pre-save middleware to validate username uniqueness per tenant
userSchema.pre('save', async function(next) {
  if (this.isModified('username')) {
    const existingUser = await this.constructor.findOne({
      tenantId: this.tenantId,
      username: this.username,
      _id: { $ne: this._id }
    });
    
    if (existingUser) {
      return next(new Error('Username already exists for this tenant'));
    }
  }
  next();
});

// Pre-save middleware to validate email uniqueness per tenant
userSchema.pre('save', async function(next) {
  if (this.isModified('email')) {
    const existingUser = await this.constructor.findOne({
      tenantId: this.tenantId,
      email: this.email,
      _id: { $ne: this._id }
    });
    
    if (existingUser) {
      return next(new Error('Email already exists for this tenant'));
    }
  }
  next();
});

export const UserModel = mongoose.model('User', userSchema);

export default UserModel;
