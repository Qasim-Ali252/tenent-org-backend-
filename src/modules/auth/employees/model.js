import mongoose from 'mongoose';
import globalSchema from '../../../utils/globalSchema.js';
import {
  tenantIdField,
  nameField,
  phoneNumberField,
  emailField,
  createReferenceField,
  createArrayReferenceField,
  schemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Employee schema
const employeeSchema = new Schema({
  tenantId: tenantIdField,
  firstName: nameField(50, 'First name'),
  lastName: nameField(50, 'Last name'),
  cnic: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values but unique non-null values
    match: [/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, 'Invalid CNIC format. Use: 12345-1234567-1']
  },
  phoneNumber: phoneNumberField,
  email: emailField,
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(dob) {
        // Must be at least 16 years old
        const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return age >= 16;
      },
      message: 'Employee must be at least 16 years old'
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  position: nameField(100, 'Position'),
  primaryBranchId: createReferenceField('Branch', 'Primary branch ID'),
  branches: createArrayReferenceField('Branch'),
  salary: {
    type: Number,
    default: 0,
    min: [0, 'Salary cannot be negative']
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: [50, 'Relationship cannot exceed 50 characters']
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format']
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['CNIC', 'CONTRACT', 'CERTIFICATE', 'OTHER'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
  // status, addedUser, modifiedUser, and display dates come from globalSchema
}, schemaOptions);

// Add global schema fields
employeeSchema.add(globalSchema);

// Compound indexes
employeeSchema.index({ tenantId: 1, email: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, phoneNumber: 1 });
employeeSchema.index({ tenantId: 1, status: 1 });
employeeSchema.index({ tenantId: 1, primaryBranchId: 1 });
employeeSchema.index({ branches: 1 });
employeeSchema.index({ cnic: 1 }, { sparse: true });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to check if employee has user account
employeeSchema.virtual('hasUserAccount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'employeeId',
  justOne: true
});

// Instance method to check if employee works at a specific branch
employeeSchema.methods.worksAtBranch = function(branchId) {
  return this.branches.some(b => b.toString() === branchId.toString());
};

// Instance method to add branch to employee
employeeSchema.methods.addBranch = async function(branchId) {
  if (!this.worksAtBranch(branchId)) {
    this.branches.push(branchId);
    await this.save();
  }
  return this;
};

// Instance method to remove branch from employee
employeeSchema.methods.removeBranch = async function(branchId) {
  this.branches = this.branches.filter(b => b.toString() !== branchId.toString());
  await this.save();
  return this;
};

// Static method to find employees by tenant
employeeSchema.statics.findByTenant = function(tenantId, status = 'ACTIVE') {
  const query = { tenantId };
  if (status) query.status = status;
  return this.find(query)
    .populate('primaryBranchId')
    .populate('branches')
    .sort({ firstName: 1, lastName: 1 });
};

// Static method to find employees by branch
employeeSchema.statics.findByBranch = function(tenantId, branchId, status = 'ACTIVE') {
  const query = { 
    tenantId,
    branches: branchId
  };
  if (status) query.status = status;
  return this.find(query)
    .populate('primaryBranchId')
    .sort({ firstName: 1, lastName: 1 });
};

// Static method to find employee by email
employeeSchema.statics.findByEmail = function(tenantId, email) {
  return this.findOne({ 
    tenantId, 
    email: email.toLowerCase(),
    status: 'ACTIVE'
  }).populate('primaryBranchId').populate('branches');
};

// Static method to find employee by phone
employeeSchema.statics.findByPhone = function(tenantId, phoneNumber) {
  return this.findOne({ 
    tenantId, 
    phoneNumber,
    status: 'ACTIVE'
  }).populate('primaryBranchId').populate('branches');
};

// Pre-save middleware to ensure primary branch is in branches array
employeeSchema.pre('save', function(next) {
  if (this.primaryBranchId && !this.worksAtBranch(this.primaryBranchId)) {
    this.branches.push(this.primaryBranchId);
  }
  next();
});

// Pre-save middleware to validate email uniqueness per tenant
employeeSchema.pre('save', async function(next) {
  if (this.isModified('email')) {
    const existingEmployee = await this.constructor.findOne({
      tenantId: this.tenantId,
      email: this.email,
      _id: { $ne: this._id }
    });
    
    if (existingEmployee) {
      return next(new Error('Email already exists for this tenant'));
    }
  }
  next();
});

export const EmployeeModel = mongoose.model('Employee', employeeSchema);

export default EmployeeModel;
