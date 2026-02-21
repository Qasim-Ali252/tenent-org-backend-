import mongoose from 'mongoose';
import globalSchema from '../../../utils/globalSchema.js';
import {
  tenantIdField,
  nameField,
  descriptionField,
  createArrayReferenceField,
  schemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Role schema
const roleSchema = new Schema({
  tenantId: tenantIdField,
  roleKey: {
    type: String,
    required: [true, 'Role key is required'],
    uppercase: true,
    trim: true,
    maxlength: [50, 'Role key cannot exceed 50 characters'],
    match: [/^[A-Z_]+$/, 'Role key can only contain uppercase letters and underscores']
  },
  name: nameField(100, 'Role name'),
  description: descriptionField(500),
  color: {
    type: String,
    default: ""
  },
  permissions: createArrayReferenceField('Permission'),
  scope: {
    type: String,
    enum: ['GLOBAL', 'BRANCH'],
    default: 'BRANCH',
    required: true
  },
  isSystemRole: {
    type: Boolean,
    default: false // System roles cannot be deleted
  },
  isActive: {
    type: Boolean,
    default: true
  }
  // status, addedUser, modifiedUser, and display dates come from globalSchema
}, schemaOptions);

// Add global schema fields
roleSchema.add(globalSchema);

// Compound indexes
roleSchema.index({ tenantId: 1, roleKey: 1 }, { unique: true });
roleSchema.index({ tenantId: 1, name: 1 });
roleSchema.index({ tenantId: 1, isActive: 1 });
roleSchema.index({ tenantId: 1, scope: 1 });

// Virtual to count users with this role
roleSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'roleId',
  count: true
});

// Instance method to check if role has a specific permission
roleSchema.methods.hasPermission = function(permissionId) {
  return this.permissions.some(p => p.toString() === permissionId.toString());
};

// Instance method to add permission
roleSchema.methods.addPermission = async function(permissionId) {
  if (!this.hasPermission(permissionId)) {
    this.permissions.push(permissionId);
    await this.save();
  }
  return this;
};

// Instance method to remove permission
roleSchema.methods.removePermission = async function(permissionId) {
  this.permissions = this.permissions.filter(p => p.toString() !== permissionId.toString());
  await this.save();
  return this;
};

// Instance method to check if role has permission by key
roleSchema.methods.hasPermissionByKey = async function(permissionKey) {
  const Permission = mongoose.model('Permission');
  const permission = await Permission.findOne({ 
    key: permissionKey.toUpperCase(),
    isActive: true 
  });
  
  if (!permission) return false;
  return this.hasPermission(permission._id);
};

// Static method to find roles by tenant
roleSchema.statics.findByTenant = function(tenantId, isActive = true) {
  const query = { tenantId };
  if (isActive !== null) query.isActive = isActive;
  return this.find(query)
    .populate('permissions')
    .sort({ name: 1 });
};

// Static method to find role by key
roleSchema.statics.findByKey = function(tenantId, roleKey) {
  return this.findOne({ 
    tenantId, 
    roleKey: roleKey.toUpperCase(),
    isActive: true
  }).populate('permissions');
};

// Static method to find roles by scope
roleSchema.statics.findByScope = function(tenantId, scope) {
  return this.find({ 
    tenantId, 
    scope,
    isActive: true
  })
  .populate('permissions')
  .sort({ name: 1 });
};

// Static method to find system roles
roleSchema.statics.findSystemRoles = function(tenantId) {
  return this.find({ 
    tenantId, 
    isSystemRole: true,
    isActive: true
  })
  .populate('permissions')
  .sort({ name: 1 });
};

// Pre-save middleware to validate roleKey uniqueness per tenant
roleSchema.pre('save', async function(next) {
  if (this.isModified('roleKey')) {
    const existingRole = await this.constructor.findOne({
      tenantId: this.tenantId,
      roleKey: this.roleKey,
      _id: { $ne: this._id }
    });
    
    if (existingRole) {
      return next(new Error('Role key already exists for this tenant'));
    }
  }
  next();
});

// Pre-remove middleware to prevent deletion of system roles
roleSchema.pre('remove', function(next) {
  if (this.isSystemRole) {
    return next(new Error('Cannot delete system role'));
  }
  next();
});

// Pre-findOneAndDelete middleware to prevent deletion of system roles
roleSchema.pre('findOneAndDelete', async function(next) {
  const role = await this.model.findOne(this.getFilter());
  if (role && role.isSystemRole) {
    return next(new Error('Cannot delete system role'));
  }
  next();
});

export const RoleModel = mongoose.model('Role', roleSchema);

export default RoleModel;
