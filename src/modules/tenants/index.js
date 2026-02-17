import TenantModel from './model.js';
import tenantService from './service.js';
import tenantController from './controller.js';
import tenantRouter from './router.js';
import * as tenantValidation from './validation.js';

export { TenantModel, tenantService, tenantController, tenantRouter, tenantValidation };

export default {
  TenantModel,
  tenantService,
  tenantController,
  tenantRouter,
  ...tenantValidation
};
