import Joi from 'joi';

// Document types
const DOCUMENT_TYPES = ['CNIC', 'CONTRACT', 'CERTIFICATE', 'OTHER'];

// Emergency contact schema
const emergencyContactSchema = Joi.object({
  name: Joi.string().max(100),
  relationship: Joi.string().max(50),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
});

// Document schema
const documentSchema = Joi.object({
  type: Joi.string().valid(...DOCUMENT_TYPES).required(),
  name: Joi.string().required(),
  url: Joi.string().uri().required(),
  uploadedAt: Joi.date()
});

// Create employee validation
export const createEmployeeSchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).required(),
  cnic: Joi.string().pattern(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  email: Joi.string().email().required(),
  dateOfBirth: Joi.date().max('now').required(),
  address: Joi.string().max(500),
  position: Joi.string().max(100).required(),
  primaryBranchId: Joi.string().hex().length(24).required(),
  branches: Joi.array().items(Joi.string().hex().length(24)),
  salary: Joi.number().min(0).default(0),
  joiningDate: Joi.date().default(Date.now),
  emergencyContact: emergencyContactSchema,
  documents: Joi.array().items(documentSchema),
  userId: Joi.string().hex().length(24).required()
});

// Update employee validation
export const updateEmployeeSchema = Joi.object({
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50),
  cnic: Joi.string().pattern(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  email: Joi.string().email(),
  dateOfBirth: Joi.date().max('now'),
  address: Joi.string().max(500),
  position: Joi.string().max(100),
  primaryBranchId: Joi.string().hex().length(24),
  branches: Joi.array().items(Joi.string().hex().length(24)),
  salary: Joi.number().min(0),
  joiningDate: Joi.date(),
  emergencyContact: emergencyContactSchema,
  documents: Joi.array().items(documentSchema),
  userId: Joi.string().hex().length(24).required()
}).min(2); // At least userId + one field to update

// Get employees query validation
export const getEmployeesQuerySchema = Joi.object({
  tenantId: Joi.string().hex().length(24).required(),
  id: Joi.string().hex().length(24),
  email: Joi.string().email(),
  phoneNumber: Joi.string(),
  branchId: Joi.string().hex().length(24),
  position: Joi.string(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED', 'ARCHIVED'),
  search: Joi.string().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('firstName', '-firstName', 'lastName', '-lastName', 'joiningDate', '-joiningDate', 'createdAt', '-createdAt')
});

// Delete employee validation
export const deleteEmployeeSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
  tenantId: Joi.string().hex().length(24).required()
});

// Add branch validation
export const addBranchSchema = Joi.object({
  branchId: Joi.string().hex().length(24).required(),
  userId: Joi.string().hex().length(24).required()
});

// Remove branch validation
export const removeBranchSchema = Joi.object({
  branchId: Joi.string().hex().length(24).required(),
  userId: Joi.string().hex().length(24).required()
});

// Add document validation
export const addDocumentSchema = Joi.object({
  type: Joi.string().valid(...DOCUMENT_TYPES).required(),
  name: Joi.string().required(),
  url: Joi.string().uri().required(),
  userId: Joi.string().hex().length(24).required()
});

// Remove document validation
export const removeDocumentSchema = Joi.object({
  documentId: Joi.string().hex().length(24).required(),
  userId: Joi.string().hex().length(24).required()
});

export default {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeesQuerySchema,
  deleteEmployeeSchema,
  addBranchSchema,
  removeBranchSchema,
  addDocumentSchema,
  removeDocumentSchema
};
