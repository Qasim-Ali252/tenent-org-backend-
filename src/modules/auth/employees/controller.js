import employeeService from './service.js';
import { apiError } from '../../../utils/apiErrorHandler.js';
import { MESSAGES } from '../../../constants/index.js';

class EmployeeController {
  /**
   * Create a new employee
   */
  async createEmployee(req, res, next) {
    try {
      const { userId, tenantId, ...employeeData } = req.body;
      const employee = await employeeService.createEmployee(tenantId, employeeData, userId);

      return res.status(201).json({
        isSuccess: true,
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employees with unified endpoint
   * Supports: get by ID, email, phone, branch, filters, pagination
   */
  async getEmployees(req, res, next) {
    try {
      const {
        tenantId,
        id,
        email,
        phoneNumber,
        branchId,
        position,
        status,
        search,
        page,
        limit,
        sort
      } = req.query;

      // Get by ID
      if (id) {
        const employee = await employeeService.getEmployeeById(id, 'primaryBranchId branches', tenantId);
        if (!employee) {
          throw apiError.notFound('Employee not found');
        }
        return res.status(200).json({
          isSuccess: true,
          data: employee
        });
      }

      // Get by email
      if (email) {
        const employee = await employeeService.getByEmail(tenantId, email);
        if (!employee) {
          throw apiError.notFound('Employee not found');
        }
        return res.status(200).json({
          isSuccess: true,
          data: employee
        });
      }

      // Get by phone
      if (phoneNumber) {
        const employee = await employeeService.getByPhone(tenantId, phoneNumber);
        if (!employee) {
          throw apiError.notFound('Employee not found');
        }
        return res.status(200).json({
          isSuccess: true,
          data: employee
        });
      }

      // Get by branch
      if (branchId) {
        const employees = await employeeService.getByBranch(tenantId, branchId, status);
        return res.status(200).json({
          isSuccess: true,
          data: employees,
          total: employees.length
        });
      }

      // Build filters
      const filters = {};
      if (status) filters.status = status;
      if (position) filters.position = position;
      if (search) filters.search = search;

      // Get with pagination
      if (page && limit) {
        const result = await employeeService.getAllEmployees(
          tenantId,
          parseInt(page),
          parseInt(limit),
          filters
        );
        return res.status(200).json({
          isSuccess: true,
          data: result.employees,
          total: result.total,
          page: result.page,
          totalPages: result.totalPages
        });
      }

      // Get all
      const employees = await employeeService.getByTenant(tenantId, status);
      return res.status(200).json({
        isSuccess: true,
        data: employees,
        total: employees.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee by ID (traditional REST endpoint)
   */
  async getEmployeeById(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;

      const employee = await employeeService.getEmployeeById(id, 'primaryBranchId branches', tenantId);
      if (!employee) {
        throw apiError.notFound('Employee not found');
      }

      return res.status(200).json({
        isSuccess: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, tenantId, ...updateData } = req.body;

      const employee = await employeeService.updateEmployee(id, tenantId, updateData, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Employee updated successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete employee (soft delete)
   */
  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { userId } = req.body;

      await employeeService.deleteEmployee(id, tenantId, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add branch to employee
   */
  async addBranch(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { branchId, userId } = req.body;

      const employee = await employeeService.addBranch(id, tenantId, branchId, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Branch added to employee successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove branch from employee
   */
  async removeBranch(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { branchId, userId } = req.body;

      const employee = await employeeService.removeBranch(id, tenantId, branchId, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Branch removed from employee successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add document to employee
   */
  async addDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { userId, ...document } = req.body;

      const employee = await employeeService.addDocument(id, tenantId, document, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Document added successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove document from employee
   */
  async removeDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.query;
      const { documentId, userId } = req.body;

      const employee = await employeeService.removeDocument(id, tenantId, documentId, userId);

      return res.status(200).json({
        isSuccess: true,
        message: 'Document removed successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmployeeController();
