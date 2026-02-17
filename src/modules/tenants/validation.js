import Joi from 'joi';

// Domain validation schema
const domainSchema = Joi.object({
  domain: Joi.string().trim().lowercase().required(),
  isDefault: Joi.boolean().default(false),
  purpose: Joi.string().valid('BRAND_WEBSITE', 'ONLINE_ORDERING', 'ADMIN_PANEL').required(),
  sslStatus: Joi.string().valid('ACTIVE', 'PENDING', 'EXPIRED').default('PENDING')
});

// Branding validation schema
const brandingSchema = Joi.object({
  logoUrl: Joi.string().uri().allow(null, ''),
  faviconUrl: Joi.string().uri().allow(null, ''),
  colors: Joi.object({
    primary: Joi.string().default('#000000'),
    secondary: Joi.string().default('#ffffff'),
    accent: Joi.string().default('#0066cc')
  }),
  fontFamily: Joi.string().default('Inter')
});

// Localisation validation schema
const localisationSchema = Joi.object({
  currency: Joi.string().uppercase().max(3).default('USD'),
  timezone: Joi.string().default('UTC'),
  locale: Joi.string().default('en-US')
});

// Subscription validation schema
const subscriptionSchema = Joi.object({
  planId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  billingCycle: Joi.string().valid('MONTHLY', 'QUARTERLY', 'ANNUAL').default('MONTHLY'),
  status: Joi.string().valid('ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL').default('TRIAL')
});

// Business settings validation schema
const businessSettingsSchema = Joi.object({
  defaultTaxPercent: Joi.number().min(0).max(100).default(0),
  serviceChargePercent: Joi.number().min(0).max(100).default(0),
  minimumOrderValue: Joi.number().min(0).default(0),
  baseDeliveryCharge: Joi.number().min(0).default(0)
});

// Offline support validation schema
const offlineSupportSchema = Joi.object({
  enabled: Joi.boolean().default(false),
  posSyncIntervalSeconds: Joi.number().min(10).default(60),
  conflictStrategy: Joi.string().valid('SERVER_WINS', 'CLIENT_WINS', 'MANUAL_RESOLVE').default('SERVER_WINS')
});

// Create tenant validation
export const createTenantValidation = Joi.object({
  name: Joi.string().trim().max(100).required(),
  legalName: Joi.string().trim().max(200).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).required(),
  domains: Joi.array().items(domainSchema).min(1).required()
    .custom((value, helpers) => {
      const defaultDomains = value.filter(d => d.isDefault);
      if (defaultDomains.length !== 1) {
        return helpers.error('array.exactlyOneDefault');
      }
      return value;
    }, 'Exactly one default domain validation')
    .messages({
      'array.exactlyOneDefault': 'Must have exactly one default domain'
    }),
  branding: brandingSchema.optional(),
  localisation: localisationSchema.optional(),
  subscription: subscriptionSchema.required(),
  businessSettings: businessSettingsSchema.optional(),
  offlineSupport: offlineSupportSchema.optional(),
  userId: Joi.string().optional() // For testing without auth
});

// Update tenant validation (all fields optional except userId)
export const updateTenantValidation = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  legalName: Joi.string().trim().max(200).optional(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).optional(),
  domains: Joi.array().items(domainSchema).min(1).optional()
    .custom((value, helpers) => {
      const defaultDomains = value.filter(d => d.isDefault);
      if (defaultDomains.length !== 1) {
        return helpers.error('array.exactlyOneDefault');
      }
      return value;
    }, 'Exactly one default domain validation')
    .messages({
      'array.exactlyOneDefault': 'Must have exactly one default domain'
    }),
  branding: brandingSchema.optional(),
  localisation: localisationSchema.optional(),
  subscription: subscriptionSchema.optional(),
  businessSettings: businessSettingsSchema.optional(),
  offlineSupport: offlineSupportSchema.optional(),
  userId: Joi.string().required()
});

// Update status validation
export const updateStatusValidation = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'ARCHIVED').required(),
  userId: Joi.string().required()
});

// Update branding validation
export const updateBrandingValidation = Joi.object({
  branding: brandingSchema.required(),
  userId: Joi.string().required()
});

// Update subscription validation
export const updateSubscriptionValidation = Joi.object({
  subscription: subscriptionSchema.required(),
  userId: Joi.string().required()
});

// Get all tenants validation (query parameters)
export const getAllTenantsValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'ARCHIVED').optional(),
  search: Joi.string().trim().optional(),
  subscriptionStatus: Joi.string().valid('ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL').optional()
});

// ID parameter validation
export const idParamValidation = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
});

// Slug parameter validation
export const slugParamValidation = Joi.object({
  slug: Joi.string().trim().lowercase().required()
});

// Domain parameter validation
export const domainParamValidation = Joi.object({
  domain: Joi.string().trim().lowercase().required()
});

// Module key parameter validation
export const moduleKeyParamValidation = Joi.object({
  moduleKey: Joi.string().trim().required()
});


// Validation helper functions (for use in controllers)
export const validateCreateTenantData = (data) => {
  const { error, value } = createTenantValidation.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: true, msg: errorMessage };
  }
  return { error: false, value };
};

export const validateUpdateTenantData = (data) => {
  const { error, value } = updateTenantValidation.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: true, msg: errorMessage };
  }
  return { error: false, value };
};

export const validateUpdateStatusData = (data) => {
  const { error, value } = updateStatusValidation.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: true, msg: errorMessage };
  }
  return { error: false, value };
};

export const validateUpdateBrandingData = (data) => {
  const { error, value } = updateBrandingValidation.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: true, msg: errorMessage };
  }
  return { error: false, value };
};

export const validateUpdateSubscriptionData = (data) => {
  const { error, value } = updateSubscriptionValidation.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: true, msg: errorMessage };
  }
  return { error: false, value };
};

// Validation middleware functions (for use in routes)
export const validateCreateTenant = (req, res, next) => {
  const result = validateCreateTenantData(req.body);
  if (result.error) {
    return res.status(400).json({
      isSuccess: false,
      message: result.msg
    });
  }
  req.body = result.value;
  next();
};

export const validateUpdateTenant = (req, res, next) => {
  const result = validateUpdateTenantData(req.body);
  if (result.error) {
    return res.status(400).json({
      isSuccess: false,
      message: result.msg
    });
  }
  req.body = result.value;
  next();
};

export const validateUpdateStatus = (req, res, next) => {
  const result = validateUpdateStatusData(req.body);
  if (result.error) {
    return res.status(400).json({
      isSuccess: false,
      message: result.msg
    });
  }
  req.body = result.value;
  next();
};

export const validateUpdateBranding = (req, res, next) => {
  const result = validateUpdateBrandingData(req.body);
  if (result.error) {
    return res.status(400).json({
      isSuccess: false,
      message: result.msg
    });
  }
  req.body = result.value;
  next();
};

export const validateUpdateSubscription = (req, res, next) => {
  const result = validateUpdateSubscriptionData(req.body);
  if (result.error) {
    return res.status(400).json({
      isSuccess: false,
      message: result.msg
    });
  }
  req.body = result.value;
  next();
};
