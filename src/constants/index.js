/**
 * Application Constants
 * Centralized constant definitions for the entire application
 */

// Application Status
export const APP_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
  DRAFT: 'DRAFT',
  PENDING: 'PENDING'
};

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  CASHIER: 'CASHIER',
  WAITER: 'WAITER',
  CHEF: 'CHEF',
  DELIVERY: 'DELIVERY'
};

// Tenant Status
export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  TRIAL: 'TRIAL'
};

// Branch Status
export const BRANCH_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  TEMPORARILY_CLOSED: 'TEMPORARILY_CLOSED',
  UNDER_MAINTENANCE: 'UNDER_MAINTENANCE'
};

// Employee Status
export const EMPLOYEE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  TERMINATED: 'TERMINATED'
};

// User Account Status
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  LOCKED: 'LOCKED',
  PENDING: 'PENDING'
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

// Order Types
export const ORDER_TYPES = {
  DINE_IN: 'DINE_IN',
  TAKEAWAY: 'TAKEAWAY',
  DELIVERY: 'DELIVERY',
  DRIVE_THRU: 'DRIVE_THRU',
  KIOSK: 'KIOSK'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  MOBILE_WALLET: 'MOBILE_WALLET',
  BANK_TRANSFER: 'BANK_TRANSFER',
  ONLINE: 'ONLINE'
};

// Product Types
export const PRODUCT_TYPES = {
  SIMPLE: 'SIMPLE',
  VARIABLE: 'VARIABLE'
};

// Visibility Channels
export const VISIBILITY_CHANNELS = {
  POS: 'POS',
  WEB: 'WEB',
  APP: 'APP',
  KIOSK: 'KIOSK'
};

// Days of Week
export const DAYS_OF_WEEK = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY'
};

// Subscription Billing Cycles
export const BILLING_CYCLES = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUAL: 'ANNUAL'
};

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  TRIAL: 'TRIAL'
};

// Role Scopes
export const ROLE_SCOPES = {
  GLOBAL: 'GLOBAL',
  BRANCH: 'BRANCH'
};

// Permission Categories
export const PERMISSION_CATEGORIES = {
  READ: 'READ',
  WRITE: 'WRITE',
  DELETE: 'DELETE',
  EXECUTE: 'EXECUTE',
  ADMIN: 'ADMIN'
};

// Station Types (Kitchen)
export const STATION_TYPES = {
  FRYER: 'FRYER',
  GRILL: 'GRILL',
  BAKERY: 'BAKERY',
  COLD: 'COLD',
  ASSEMBLY: 'ASSEMBLY',
  BEVERAGE: 'BEVERAGE',
  OTHER: 'OTHER'
};

// Allergens
export const ALLERGENS = {
  GLUTEN: 'GLUTEN',
  DAIRY: 'DAIRY',
  EGGS: 'EGGS',
  NUTS: 'NUTS',
  PEANUTS: 'PEANUTS',
  SOY: 'SOY',
  FISH: 'FISH',
  SHELLFISH: 'SHELLFISH',
  SESAME: 'SESAME'
};

// Variant Choice Types
export const VARIANT_CHOICE_TYPES = {
  SIZE: 'SIZE',
  CRUST: 'CRUST',
  TOPPING: 'TOPPING',
  SAUCE: 'SAUCE',
  SIDE: 'SIDE',
  DRINK: 'DRINK',
  CUSTOM: 'CUSTOM'
};

// Addon Types
export const ADDON_TYPES = {
  EXTRA: 'EXTRA',
  SIDE: 'SIDE',
  SAUCE: 'SAUCE',
  TOPPING: 'TOPPING',
  DRINK: 'DRINK',
  DESSERT: 'DESSERT'
};

// Error Messages
export const MESSAGES = {
  // General
  SUCCESS: 'Operation completed successfully',
  ERROR: 'An error occurred',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  
  // Validation
  INVALID_ID: 'Invalid ID format',
  INVALID_IDS: 'Invalid ID format in array',
  REQUIRED_FIELD: 'Required field is missing',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone number format',
  
  // Authentication
  INVALID_CREDENTIALS: 'Invalid username or password',
  ACCOUNT_LOCKED: 'Account is locked',
  ACCOUNT_INACTIVE: 'Account is not active',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  
  // Tenant
  TENANT_NOT_FOUND: 'Tenant not found',
  TENANT_INACTIVE: 'Tenant is not active',
  TENANT_SUSPENDED: 'Tenant is suspended',
  SLUG_EXISTS: 'Slug already exists',
  DOMAIN_EXISTS: 'Domain already exists',
  
  // Branch
  BRANCH_NOT_FOUND: 'Branch not found',
  BRANCH_CODE_EXISTS: 'Branch code already exists',
  
  // Employee
  EMPLOYEE_NOT_FOUND: 'Employee not found',
  EMAIL_EXISTS: 'Email already exists',
  PHONE_EXISTS: 'Phone number already exists',
  
  // User
  USER_NOT_FOUND: 'User not found',
  USERNAME_EXISTS: 'Username already exists',
  EMPLOYEE_HAS_ACCOUNT: 'Employee already has a user account',
  
  // Role
  ROLE_NOT_FOUND: 'Role not found',
  ROLE_KEY_EXISTS: 'Role key already exists',
  CANNOT_DELETE_SYSTEM_ROLE: 'Cannot delete system role',
  ROLE_IN_USE: 'Role is assigned to users',
  
  // Product
  PRODUCT_NOT_FOUND: 'Product not found',
  SKU_EXISTS: 'SKU already exists',
  
  // Category
  CATEGORY_NOT_FOUND: 'Category not found',
  
  // Order
  ORDER_NOT_FOUND: 'Order not found',
  INVALID_ORDER_STATUS: 'Invalid order status',
  
  // Payment
  PAYMENT_FAILED: 'Payment processing failed',
  INSUFFICIENT_AMOUNT: 'Insufficient payment amount',
  
  // Subscription
  SUBSCRIPTION_EXPIRED: 'Subscription has expired',
  SUBSCRIPTION_INACTIVE: 'Subscription is not active',
  MODULE_ACCESS_DENIED: 'Module access denied'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Date Formats
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  DISPLAY: 'MM-DD-YYYY HH:mm:ss'
};

// Currency
export const CURRENCY = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  INR: 'INR',
  AUD: 'AUD',
  CAD: 'CAD'
};

// Timezones (common ones)
export const TIMEZONES = {
  UTC: 'UTC',
  EST: 'America/New_York',
  CST: 'America/Chicago',
  MST: 'America/Denver',
  PST: 'America/Los_Angeles',
  GMT: 'Europe/London',
  IST: 'Asia/Kolkata'
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Regex Patterns
export const REGEX = {
  EMAIL: /^\S+@\S+\.\S+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  SLUG: /^[a-z0-9-]+$/,
  SKU: /^[A-Z0-9-]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
};

// Import Messages from messeges.js for backward compatibility
import Messages from './messeges.js';
export { Messages as MESSEGES, Messages };

// Export all constants
export default {
  APP_STATUS,
  USER_ROLES,
  TENANT_STATUS,
  BRANCH_STATUS,
  EMPLOYEE_STATUS,
  USER_STATUS,
  ORDER_STATUS,
  ORDER_TYPES,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  PRODUCT_TYPES,
  VISIBILITY_CHANNELS,
  DAYS_OF_WEEK,
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  ROLE_SCOPES,
  PERMISSION_CATEGORIES,
  STATION_TYPES,
  ALLERGENS,
  VARIANT_CHOICE_TYPES,
  ADDON_TYPES,
  MESSAGES,
  HTTP_STATUS,
  PAGINATION,
  DATE_FORMATS,
  CURRENCY,
  TIMEZONES,
  FILE_UPLOAD,
  REGEX
};
