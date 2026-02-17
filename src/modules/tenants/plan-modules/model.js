import mongoose from 'mongoose';
import {
  createReferenceField,
  createArrayReferenceField,
  isActiveField,
  basicSchemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Config subdocument schema
const configSchema = new Schema({
  allowOffline: {
    type: Boolean,
    default: false
  },
  maxDevices: {
    type: Number,
    default: 1,
    min: 1
  },
  customSettings: {
    type: Map,
    of: Schema.Types.Mixed,
    default: () => new Map()
  }
}, { _id: false });

// Plan Module schema (links plans to modules with permissions)
const planModuleSchema = new Schema({
  planId: createReferenceField('Plan', 'Plan ID'),
  moduleId: createReferenceField('Module', 'Module ID'),
  enabled: {
    type: Boolean,
    default: true
  },
  permissions: createArrayReferenceField('Permission'),
  config: {
    type: configSchema,
    default: () => ({})
  }
}, basicSchemaOptions);

// Compound indexes
planModuleSchema.index({ planId: 1, moduleId: 1 }, { unique: true });
planModuleSchema.index({ planId: 1, enabled: 1 });
planModuleSchema.index({ moduleId: 1 });

// Virtual to populate plan
planModuleSchema.virtual('plan', {
  ref: 'Plan',
  localField: 'planId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate module
planModuleSchema.virtual('module', {
  ref: 'Module',
  localField: 'moduleId',
  foreignField: '_id',
  justOne: true
});

// Static method to find modules by plan
planModuleSchema.statics.findByPlan = function(planId, enabled = true) {
  const query = { planId };
  if (enabled !== null) query.enabled = enabled;
  return this.find(query)
    .populate('moduleId')
    .populate('permissions')
    .sort({ 'moduleId.displayOrder': 1 });
};

// Static method to find plans by module
planModuleSchema.statics.findByModule = function(moduleId, enabled = true) {
  const query = { moduleId };
  if (enabled !== null) query.enabled = enabled;
  return this.find(query)
    .populate('planId')
    .sort({ 'planId.displayOrder': 1 });
};

// Static method to check if plan has module
planModuleSchema.statics.planHasModule = async function(planId, moduleId) {
  const planModule = await this.findOne({ 
    planId, 
    moduleId, 
    enabled: true 
  });
  return !!planModule;
};

// Static method to get module permissions for plan
planModuleSchema.statics.getModulePermissions = async function(planId, moduleId) {
  const planModule = await this.findOne({ 
    planId, 
    moduleId, 
    enabled: true 
  }).populate('permissions');
  
  return planModule ? planModule.permissions : [];
};

export const PlanModuleModel = mongoose.model('PlanModule', planModuleSchema);

export default PlanModuleModel;
