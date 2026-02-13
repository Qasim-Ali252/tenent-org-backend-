import mongoose from 'mongoose';
import { 
  nameField, 
  descriptionField, 
  displayOrderField, 
  isActiveField, 
  basicSchemaOptions 
} from '../../utils/commonFields.js';

const { Schema } = mongoose;

// Price subdocument schema
const priceSchema = new Schema({
  monthly: {
    type: Number,
    required: true,
    min: 0
  },
  yearly: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Limits subdocument schema
const limitsSchema = new Schema({
  maxBranches: {
    type: Number,
    default: 1,
    min: 1
  },
  maxUsers: {
    type: Number,
    default: 5,
    min: 1
  },
  maxPOSDevices: {
    type: Number,
    default: 1,
    min: 1
  },
  maxOrdersPerMonth: {
    type: Number,
    default: 1000,
    min: 0
  }
}, { _id: false });

// Plan schema
const planSchema = new Schema({
  planKey: {
    type: String,
    required: [true, 'Plan key is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z_]+$/, 'Plan key can only contain uppercase letters and underscores']
  },
  name: nameField(50),
  description: descriptionField(500),
  price: {
    type: priceSchema,
    required: true
  },
  limits: {
    type: limitsSchema,
    default: () => ({})
  },
  isActive: isActiveField,
  displayOrder: displayOrderField
}, basicSchemaOptions);

// Indexes
planSchema.index({ planKey: 1 });
planSchema.index({ isActive: 1 });
planSchema.index({ displayOrder: 1 });

// Virtual for monthly savings
planSchema.virtual('yearlySavings').get(function() {
  return (this.price.monthly * 12) - this.price.yearly;
});

// Static method to find active plans
planSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

// Static method to find plan by key
planSchema.statics.findByKey = function(planKey) {
  return this.findOne({ planKey: planKey.toUpperCase(), isActive: true });
};

export const PlanModel = mongoose.model('Plan', planSchema);

export default PlanModel;
