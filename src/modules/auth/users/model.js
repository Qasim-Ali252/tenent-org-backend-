import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import globalSchema from '../../../utils/globalSchema.js';
import {
  tenantIdField,
  createReferenceField,
  schemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// User schema (login credentials for employees)
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  roleId: createReferenceField('Role', 'Role ID'),
  lastLoginAt: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  isAccountEnable: {
    type: Boolean,
    default: true
  },
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
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

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

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
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

// Pre-update hook to hash password on update
userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  if (update.$set && update.$set.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      update.$set.password = await bcrypt.hash(update.$set.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Instance method to check password
userSchema.methods.checkPassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account after 5 failed attempts for 2 hours
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return await this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  await this.save();
  return this;
};

// Static method to find users by tenant
userSchema.statics.findByTenant = function(tenantId, status = 'ACTIVE') {
  const query = { tenantId };
  if (status) query.status = status;
  return this.find(query)
    .populate('employeeId')
    .populate('roleId')
    .sort({ username: 1 });
};

// Static method to find user by username
userSchema.statics.findByUsername = function(tenantId, username) {
  return this.findOne({ 
    tenantId, 
    username: username.toLowerCase(),
    status: 'ACTIVE'
  })
  .populate('employeeId')
  .populate('roleId');
};

// Static method to find user by email
userSchema.statics.findByEmail = function(tenantId, email) {
  return this.findOne({ 
    tenantId, 
    email: email.toLowerCase(),
    status: 'ACTIVE'
  })
  .populate('employeeId')
  .populate('roleId');
};

// Static method to find user by employee
userSchema.statics.findByEmployee = function(tenantId, employeeId) {
  return this.findOne({ 
    tenantId, 
    employeeId,
    status: 'ACTIVE'
  })
  .populate('employeeId')
  .populate('roleId');
};

// Static method to find users by role
userSchema.statics.findByRole = function(tenantId, roleId) {
  return this.find({ 
    tenantId, 
    roleId,
    status: 'ACTIVE'
  })
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

// Pre-save middleware to validate one user per employee
userSchema.pre('save', async function(next) {
  if (this.isModified('employeeId')) {
    const existingUser = await this.constructor.findOne({
      tenantId: this.tenantId,
      employeeId: this.employeeId,
      _id: { $ne: this._id }
    });
    
    if (existingUser) {
      return next(new Error('This employee already has a user account'));
    }
  }
  next();
});


export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export default UserModel;
