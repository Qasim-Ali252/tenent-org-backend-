// Models
import EmployeeModel from './employees/model.js';
import { UserModel } from '../users/model.js'; // Use the main user model
import RoleModel from './roles/model.js';

// Services
import employeeService from './employees/service.js';
import userService from './users/service.js';
import roleService from './roles/service.js';

export {
  // Models
  EmployeeModel,
  UserModel,
  RoleModel,
  
  // Services
  employeeService,
  userService,
  roleService
};

export default {
  EmployeeModel,
  UserModel,
  RoleModel,
  employeeService,
  userService,
  roleService
};
