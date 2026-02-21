export const defaultPermissions = [
  // User Management
  {
    key: 'USER_VIEW',
    name: 'View Users',
    moduleKey: 'USER_MANAGEMENT',
    route: '/api/v1/users',
    method: 'GET',
    displayOrder: 1
  },
  {
    key: 'USER_CREATE',
    name: 'Create Users',
    moduleKey: 'USER_MANAGEMENT',
    route: '/api/v1/users',
    method: 'POST',
    displayOrder: 2
  },
  {
    key: 'USER_EDIT',
    name: 'Edit Users',
    moduleKey: 'USER_MANAGEMENT',
    route: '/api/v1/users',
    method: 'PUT',
    displayOrder: 3
  },
  
  // Permission Management (Admin only)
  {
    key: 'PERM_ADMIN_ALL',
    name: 'Manage Permissions',
    moduleKey: 'ADMIN_TOOLS',
    route: '/api/v1/permissions',
    method: 'ALL',
    isSystem: true,
    displayOrder: 100
  },

  // Role Management
  {
    key: 'ROLE_VIEW',
    name: 'View Roles',
    moduleKey: 'USER_MANAGEMENT',
    route: '/api/v1/roles',
    method: 'GET',
    displayOrder: 10
  }
];
