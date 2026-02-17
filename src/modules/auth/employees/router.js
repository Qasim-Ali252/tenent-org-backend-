import express from 'express';
import employeeController from './controller.js';
import { isAuthorized } from '../../../middleware/auth.js';
import { validate } from '../../../validation/index.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeesQuerySchema,
  deleteEmployeeSchema,
  addBranchSchema,
  removeBranchSchema,
  addDocumentSchema,
  removeDocumentSchema
} from './validation.js';

const router = express.Router();

/**
 * @route   POST /api/v1/employees
 * @desc    Create a new employee
 * @access  Protected
 */
router.post(
  '/',
  isAuthorized,
  validate(createEmployeeSchema),
  employeeController.createEmployee
);

/**
 * @route   GET /api/v1/employees
 * @desc    Get employees (unified endpoint with query parameters)
 * @query   tenantId, id, email, phoneNumber, branchId, position, status, search, page, limit, sort
 * @access  Protected
 */
router.get(
  '/',
  isAuthorized,
  validate(getEmployeesQuerySchema, 'query'),
  employeeController.getEmployees
);

/**
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee by ID (traditional REST style)
 * @access  Protected
 */
router.get(
  '/:id',
  isAuthorized,
  employeeController.getEmployeeById
);

/**
 * @route   PUT /api/v1/employees/:id
 * @desc    Update employee
 * @access  Protected
 */
router.put(
  '/:id',
  isAuthorized,
  validate(updateEmployeeSchema),
  employeeController.updateEmployee
);

/**
 * @route   DELETE /api/v1/employees/:id
 * @desc    Delete employee (soft delete)
 * @access  Protected
 */
router.delete(
  '/:id',
  isAuthorized,
  validate(deleteEmployeeSchema, 'query'),
  employeeController.deleteEmployee
);

/**
 * @route   POST /api/v1/employees/:id/branches
 * @desc    Add branch to employee
 * @access  Protected
 */
router.post(
  '/:id/branches',
  isAuthorized,
  validate(addBranchSchema),
  employeeController.addBranch
);

/**
 * @route   DELETE /api/v1/employees/:id/branches
 * @desc    Remove branch from employee
 * @access  Protected
 */
router.delete(
  '/:id/branches',
  isAuthorized,
  validate(removeBranchSchema),
  employeeController.removeBranch
);

/**
 * @route   POST /api/v1/employees/:id/documents
 * @desc    Add document to employee
 * @access  Protected
 */
router.post(
  '/:id/documents',
  isAuthorized,
  validate(addDocumentSchema),
  employeeController.addDocument
);

/**
 * @route   DELETE /api/v1/employees/:id/documents
 * @desc    Remove document from employee
 * @access  Protected
 */
router.delete(
  '/:id/documents',
  isAuthorized,
  validate(removeDocumentSchema),
  employeeController.removeDocument
);

export default router;
