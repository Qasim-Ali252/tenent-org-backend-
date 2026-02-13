import mongoose from 'mongoose';
import { 
  createReferenceField, 
  basicSchemaOptions 
} from '../../utils/commonFields.js';

const { Schema } = mongoose;

// Config subdocument schema for module-specific settings
const configSchema = new Schema({
  allowOffline: {
    type: Boolean,
    default: false
  },
  maxDevices: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: false, strict: false }); // strict: false allows additional fields

// PlanModule schema - links plans to modules with permissions
const planModuleSchema = new Schema({
  planId: createReferenceField('Plan', true),
  moduleId: createReferenceField('Module', true),
  moduleKey: {
    type: String,
    required: [true, 'Module key is required'],
    uppercase: true,
    trim: true
  },
  moduleName: {
    type: String,
    required: [true, 'Module name is required'],
    trim: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  permissionIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  config: {
    type: configSchema,
    default: () => ({})
  }
}, basicSchemaOptions);

// Compound indexes for performance
planModuleSchema.index({ planId: 1, moduleId: 1 }, { unique: true });
planModuleSchema.index({ planId: 1, moduleKey: 1 });
planModuleSchema.index({ planId: 1, enabled: 1 });
planModuleSchema.index({ moduleId: 1 });

// Static method to find modules for a plan
planModuleSchema.statics.findByPlan = function(planId) {
  return this.find({ planId, enabled: true })
    .populate('moduleId')
    .populate('permissionIds')
    .sort({ 'moduleId.displayOrder': 1 });
};

// Static method to check if plan has module access
planModuleSchema.statics.hasModuleAccess = async function(planId, moduleKey) {
  const planModule = await this.findOne({
    planId,
    moduleKey: moduleKey.toUpperCase(),
    enabled: true
  });
  return !!planModule;
};

// Static method to get permissions for a plan module
planModuleSchema.statics.getPermissions = function(planId, moduleKey) {
  return this.findOne({
    planId,
    moduleKey: moduleKey.toUpperCase(),
    enabled: true
  }).populate('permissionIds');
};

export const PlanModuleModel = mongoose.model('PlanModule', planModuleSchema);

export default PlanModuleModel;
