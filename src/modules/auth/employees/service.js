import GlobalService from '../../../utils/globalService.js';
import EmployeeModel from './model.js';
import { apiError } from '../../../utils/index.js';

/**
 * EmployeeService - Service layer for employee operations
 * Extends GlobalService for common CRUD operations
 */
class EmployeeService extends GlobalService {
  constructor() {
    super(EmployeeModel);
  }

  /**
   * Get employee by ID
   * @param {String} employeeId - Employee ID
   * @param {String} populateFields - Fields to populate
   * @param {String} tenantId - Tenant ID
   * @returns {Object|null} Employee or null
   */
  async getEmployeeById(employeeId, populateFields = 'primaryBranchId branches', tenantId) {
    return await this.getById(
      employeeId,
      { populate: populateFields },
      tenantId
    );
  }

  /**
   * Get employee by email
   * @param {String} tenantId - Tenant ID
   * @param {String} email - Email address
   * @returns {Object|null} Employee or null
   */
  async getByEmail(tenantId, email) {
    return await this.getOneByConditions(
      { email: email.toLowerCase() },
      { populate: 'primaryBranchId branches' },
      tenantId
    );
  }

  /**
   * Get employee by phone
   * @param {String} tenantId - Tenant ID
   * @param {String} phoneNumber - Phone number
   * @returns {Object|null} Employee or null
   */
  async getByPhone(tenantId, phoneNumber) {
    return await this.getOneByConditions(
      { phoneNumber },
      { populate: 'primaryBranchId branches' },
      tenantId
    );
  }

  /**
   * Get all employees for a tenant
   * @param {String} tenantId - Tenant ID
   * @param {String} status - Status filter (default: 'ACTIVE')
   * @returns {Array} Array of employees
   */
  async getByTenant(tenantId, status = 'ACTIVE') {
    const filters = status ? { status } : {};
    return await this.getAll(
      filters,
      { sort: { firstName: 1, lastName: 1 }, populate: 'primaryBranchId branches' },
      tenantId
    );
  }

  /**
   * Get employees by branch
   * @param {String} tenantId - Tenant ID
   * @param {String} branchId - Branch ID
   * @param {String} status - Status filter (default: 'ACTIVE')
   * @returns {Array} Array of employees
   */
  async getByBranch(tenantId, branchId, status = 'ACTIVE') {
    const filters = { branches: branchId };
    if (status) filters.status = status;

    return await this.getAll(
      filters,
      { sort: { firstName: 1, lastName: 1 }, populate: 'primaryBranchId branches' },
      tenantId
    );
  }

  /**
   * Get all employees with pagination
   * @param {String} tenantId - Tenant ID
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {Object} filters - Query filters
   * @returns {Object} { employees, total, page, totalPages }
   */
  async getAllEmployees(tenantId, page = 1, limit = 10, filters = {}) {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.branchId) query.branches = filters.branchId;
    if (filters.position) query.position = { $regex: filters.position, $options: 'i' };
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phoneNumber: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const result = await this.getAllWithPagination(
      query,
      page,
      limit,
      { sort: { firstName: 1, lastName: 1 }, populate: 'primaryBranchId branches' },
      tenantId
    );

    return {
      employees: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  }

  /**
   * Create employee with validation
   * @param {String} tenantId - Tenant ID
   * @param {Object} data - Employee data
   * @param {String} userId - User ID creating the employee
   * @returns {Object} Created employee
   */
  async createEmployee(tenantId, data, userId) {
    // Check if email already exists
    const emailExists = await this.exists(
      { email: data.email.toLowerCase() },
      tenantId
    );

    if (emailExists) {
      throw apiError.badRequest('Employee with this email already exists');
    }

    // Check if phone already exists
    const phoneExists = await this.exists(
      { phoneNumber: data.phoneNumber },
      tenantId
    );

    if (phoneExists) {
      throw apiError.badRequest('Employee with this phone number already exists');
    }

    return await this.create({
      ...data,
      tenantId,
      email: data.email.toLowerCase(),
      addedUser: userId,
      modifiedUser: userId
    }, { populate: 'primaryBranchId branches' });
  }

  /**
   * Update employee with validation
   * @param {String} employeeId - Employee ID
   * @param {String} tenantId - Tenant ID
   * @param {Object} data - Update data
   * @param {String} userId - User ID modifying the employee
   * @returns {Object} Updated employee
   */
  async updateEmployee(employeeId, tenantId, data, userId) {
    // If updating email, check uniqueness
    if (data.email) {
      const existing = await this.getOneByConditions(
        { email: data.email.toLowerCase(), _id: { $ne: employeeId } },
        {},
        tenantId
      );

      if (existing) {
        throw apiError.badRequest('Employee with this email already exists');
      }
      data.email = data.email.toLowerCase();
    }

    // If updating phone, check uniqueness
    if (data.phoneNumber) {
      const existing = await this.getOneByConditions(
        { phoneNumber: data.phoneNumber, _id: { $ne: employeeId } },
        {},
        tenantId
      );

      if (existing) {
        throw apiError.badRequest('Employee with this phone number already exists');
      }
    }

    return await this.update(
      employeeId,
      {
        ...data,
        modifiedUser: userId
      },
      { populate: 'primaryBranchId branches' },
      tenantId
    );
  }

  /**
   * Update employee status
   * @param {String} employeeId - Employee ID
   * @param {String} tenantId - Tenant ID
   * @param {String} status - New status
   * @param {String} userId - User ID modifying the status
   * @returns {Object} Updated employee
   */
  async updateStatus(employeeId, tenantId, status, userId) {
    return await this.update(
      employeeId,
      { 
        status,
        modifiedUser: userId
      },
      { populate: 'primaryBranchId branches' },
      tenantId
    );
  }

  /**
   * Add branch to employee
   * @param {String} employeeId - Employee ID
   * @param {String} tenantId - Tenant ID
   * @param {String} branchId - Branch ID
   * @param {String} userId - User ID modifying the employee
   * @returns {Object} Updated employee
   */
  async addBranch(employeeId, tenantId, branchId, userId) {
    const employee = await this.Model.findOne({ _id: employeeId, tenantId });
    if (!employee) {
      throw apiError.notFound('Employee not found');
    }
    employee.modifiedUser = userId;
    return await employee.addBranch(branchId);
  }

  /**
   * Remove branch from employee
   * @param {String} employeeId - Employee ID
   * @param {String} tenantId - Tenant ID
   * @param {String} branchId - Branch ID
   * @param {String} userId - User ID modifying the employee
   * @returns {Object} Updated employee
   */
  async removeBranch(employeeId, tenantId, branchId, userId) {
    const employee = await this.Model.findOne({ _id: employeeId, tenantId });
    if (!employee) {
      throw apiError.notFound('Employee not found');
    }
    
    // Prevent removing primary branch
    if (employee.primaryBranchId.toString() === branchId.toString()) {
      throw apiError.badRequest('Cannot remove primary branch');
    }
    
    employee.modifiedUser = userId;
    return await employee.removeBranch(branchId);
  }

  /**
   * Update primary branch
   * @param {String} employeeId - Employee ID
   * @param {String} tenantId - Tenant ID
   * @param {String} branchId - Branch ID
   * @param {String} userId - User ID modifying the employee
   * @returns {Object} Updated employee
   */
  async updatePrimaryBranch(employeeId, tenantId, branchId, userId) {
    const employee = await this.Model.findOne({ _id: employeeId, tenantId });
    if (!employee) {
      throw apiError.notFound('Employee not found');
    }

    employee.primaryBranchId = branchId;
    employee.modifiedUser = userId;
    
    // Ensure new primary branch is in branches array
    if (!employee.worksAtBranch(branchId)) {
      employee.branches.push(branchId);
    }
    
    await employee.save();
    return employee.toJSON();
  }

  /**
   * Add document to employee
   * @param {String} employeeId - Employee ID
   * @param {String} tenantId - Tenant ID
   * @param {Object} document - Document object
   * @param {String} userId - User ID modifying the employee
   * @returns {Object} Updated employee
   */
  async addDocument(employeeId, tenantId, document, userId) {
    return await this.Model.findOneAndUpdate(
      { _id: employeeId, tenantId },
      { 
        $push: { documents: document },
        modifiedUser: userId
      },
      { new: true }
    ).then(doc => doc ? doc.toJSON() : null);
  }

  /**
   * Remove document from employee
   * @param {String} employeeId - Employee ID
   * @param {String} tenantId - Tenant ID
   * @param {String} documentId - Document ID
   * @param {String} userId - User ID modifying the employee
   * @returns {Object} Updated employee
   */
  async removeDocument(employeeId, tenantId, documentId, userId) {
    return await this.Model.findOneAndUpdate(
      { _id: employeeId, tenantId },
      { 
        $pull: { documents: { _id: documentId } },
        modifiedUser: userId
      },
      { new: true }
    ).then(doc => doc ? doc.toJSON() : null);
  }

  /**
   * Delete employee (soft delete - set status to TERMINATED)
   * @param {String} employeeId - Employee ID
   * @param {String} tenantId - Tenant ID
   * @param {String} userId - User ID deleting the employee
   * @returns {Object} Updated employee
   */
  async deleteEmployee(employeeId, tenantId, userId) {
    return await this.update(
      employeeId,
      { 
        status: 'TERMINATED',
        modifiedUser: userId
      },
      {},
      tenantId
    );
  }

  /**
   * Hard delete employee
   * @param {String} employeeId - Employee ID
   * @param {String} tenantId - Tenant ID
   * @returns {Object} Deleted employee
   */
  async hardDeleteEmployee(employeeId, tenantId) {
    return await this.hardDeleteOne(employeeId, tenantId);
  }

  /**
   * Count employees
   * @param {String} tenantId - Tenant ID
   * @param {Object} condition - Additional conditions
   * @returns {Number} Count
   */
  async countEmployees(tenantId, condition = {}) {
    return await this.countDocuments(condition, tenantId);
  }

  /**
   * Check if employee works at branch
   * @param {String} employeeId - Employee ID
   * @param {String} branchId - Branch ID
   * @returns {Boolean} True if works at branch
   */
  async worksAtBranch(employeeId, branchId) {
    const employee = await this.Model.findById(employeeId);
    if (!employee) {
      throw apiError.notFound('Employee not found');
    }
    return employee.worksAtBranch(branchId);
  }
}

// Export singleton instance
export default new EmployeeService();
