import BranchModel from './model.js';
import branchService from './service.js';
import branchController from './controller.js';
import branchRouter from './router.js';
import * as branchValidation from './validation.js';

export { BranchModel, branchService, branchController, branchRouter, branchValidation };

export default {
  BranchModel,
  branchService,
  branchController,
  branchRouter,
  ...branchValidation
};
