import mongoose from 'mongoose';
import { 
  nameField, 
  descriptionField, 
  displayOrderField, 
  isActiveField, 
  basicSchemaOptions 
} from '../../utils/commonFields.js';

const { Schema } = mongoose;

// Module schema
const moduleSchema = new Schema({
  moduleKey: {
    type: String,
    required: [true, 'Module key is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z_]+$/, 'Module key can only contain uppercase letters and underscores']
  },
  name: nameField(100),
  description: descriptionField(500),
  icon: {
    type: String,
    default: null
  },
  displayOrder: displayOrderField,
  isActive: isActiveField
}, basicSchemaOptions);

// Indexes
moduleSchema.index({ moduleKey: 1 });
moduleSchema.index({ isActive: 1 });
moduleSchema.index({ displayOrder: 1 });

// Static method to find active modules
moduleSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

// Static method to find module by key
moduleSchema.statics.findByKey = function(moduleKey) {
  return this.findOne({ moduleKey: moduleKey.toUpperCase(), isActive: true });
};

export const ModuleModel = mongoose.model('Module', moduleSchema);

export default ModuleModel;
