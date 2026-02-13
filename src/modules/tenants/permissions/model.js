import mongoose from 'mongoose';
import { 
  nameField, 
  descriptionField, 
  isActiveField, 
  basicSchemaOptions 
} from '../../utils/commonFields.js';

const { Schema } = mongoose;

// Permission schema
const permissionSchema = new Schema({
  key: {
    type: String,
    required: [true, 'Permission key is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z_]+$/, 'Permission key can only contain uppercase letters and underscores']
  },
  name: nameField(100),
  moduleKey: {
    type: String,
    required: [true, 'Module key is required'],
    uppercase: true,
    trim: true
  },
  description: descriptionField(500),
  category: {
    type: String,
    enum: ['READ', 'WRITE', 'DELETE', 'EXECUTE', 'ADMIN'],
    default: 'READ'
  },
  isActive: isActiveField
}, basicSchemaOptions);

// Indexes
permissionSchema.index({ key: 1 });
permissionSchema.index({ moduleKey: 1 });
permissionSchema.index({ isActive: 1 });
permissionSchema.index({ moduleKey: 1, category: 1 });

// Static method to find permissions by module
permissionSchema.statics.findByModule = function(moduleKey) {
  return this.find({ 
    moduleKey: moduleKey.toUpperCase(), 
    isActive: true 
  }).sort({ name: 1 });
};

// Static method to find permission by key
permissionSchema.statics.findByKey = function(key) {
  return this.findOne({ key: key.toUpperCase(), isActive: true });
};

// Static method to find permissions by keys
permissionSchema.statics.findByKeys = function(keys) {
  const upperKeys = keys.map(k => k.toUpperCase());
  return this.find({ 
    key: { $in: upperKeys }, 
    isActive: true 
  });
};

export const PermissionModel = mongoose.model('Permission', permissionSchema);

export default PermissionModel;
