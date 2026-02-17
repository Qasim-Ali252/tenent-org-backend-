import Joi from 'joi';

/**
 * Validation schemas for organization settings
 */

// Create organization settings validation
export const validateCreateorganizationSettings = (data) => {
  const schema = Joi.object({
    // Testing fields (temporarily allowed for auth bypass)
    tenantId: Joi.string().optional(), // Optional as it can come from req.user
    userId: Joi.string().optional(), // Optional for testing without auth
    
    // Basic Information
    organizationName: Joi.string().min(2).max(200).required().trim().messages({
      'string.empty': 'Organization name is required',
      'string.min': 'Organization name must be at least 2 characters',
      'string.max': 'Organization name cannot exceed 200 characters'
    }),
    logo: Joi.string().allow(null, '').optional(),
    currency: Joi.string().required().valid('USD', 'EUR', 'GBP', 'INR', 'CAD', 'PKR', 'AED', 'SAR').messages({
      'string.empty': 'Currency is required',
      'any.only': 'Invalid currency. Must be one of: USD, EUR, GBP, INR, CAD, PKR, AED, SAR'
    }),
    timezone: Joi.string().required().valid('EST', 'CST', 'PST', 'MST', 'IST', 'GMT', 'CET', 'JST', 'AEST').messages({
      'string.empty': 'Timezone is required',
      'any.only': 'Invalid timezone. Must be one of: EST, CST, PST, MST, IST, GMT, CET, JST, AEST'
    }),
    locale: Joi.string().required().valid('en-US', 'en-GB', 'en-IN', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA').messages({
      'string.empty': 'Locale is required',
      'any.only': 'Invalid locale. Must be one of: en-US, en-GB, en-IN, es-ES, fr-FR, de-DE, ar-SA'
    }),
    
    // Subscription Details
    planName: Joi.string().required().trim().messages({
      'string.empty': 'Plan name is required'
    }),
    startDate: Joi.date().required().messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required'
    }),
    endDate: Joi.date().required().greater(Joi.ref('startDate')).messages({
      'date.base': 'End date must be a valid date',
      'any.required': 'End date is required',
      'date.greater': 'End date must be after start date'
    }),
    billingCycle: Joi.string().required().valid('monthly', 'quarterly', 'yearly').messages({
      'string.empty': 'Billing cycle is required',
      'any.only': 'Billing cycle must be one of: monthly, quarterly, yearly'
    }),
    
    // Business Settings
    defaultTaxPercentage: Joi.number().required().min(0).max(100).messages({
      'number.base': 'Tax percentage must be a number',
      'any.required': 'Tax percentage is required',
      'number.min': 'Tax percentage cannot be negative',
      'number.max': 'Tax percentage cannot exceed 100'
    }),
    serviceChargePercentage: Joi.number().required().min(0).max(100).messages({
      'number.base': 'Service charge percentage must be a number',
      'any.required': 'Service charge percentage is required',
      'number.min': 'Service charge percentage cannot be negative',
      'number.max': 'Service charge percentage cannot exceed 100'
    }),
    minimumOrderValue: Joi.number().required().min(0).messages({
      'number.base': 'Minimum order value must be a number',
      'any.required': 'Minimum order value is required',
      'number.min': 'Minimum order value cannot be negative'
    }),
    baseDeliveryCharges: Joi.number().required().min(0).messages({
      'number.base': 'Base delivery charges must be a number',
      'any.required': 'Base delivery charges is required',
      'number.min': 'Base delivery charges cannot be negative'
    }),
    
    // Legacy/Optional fields
    contactEmail: Joi.string().email().allow(null, '').optional().messages({
      'string.email': 'Invalid email format'
    }),
    phoneNumber: Joi.string().allow(null, '').optional(),
    address: Joi.string().max(500).allow(null, '').optional().messages({
      'string.max': 'Address cannot exceed 500 characters'
    })
  });

  const result = schema.validate(data, { abortEarly: false });
  return {
    error: result?.error,
    msg: result?.error?.details?.map(d => d.message).join(', ')
  };
};

// Update organization settings validation
export const validateUpdateorganizationSettings = (data) => {
  const schema = Joi.object({
    // Testing fields (temporarily allowed for auth bypass)
    tenantId: Joi.string().optional(),
    userId: Joi.string().optional(),
    
    // Basic Information
    organizationName: Joi.string().min(2).max(200).optional().trim().messages({
      'string.min': 'Organization name must be at least 2 characters',
      'string.max': 'Organization name cannot exceed 200 characters'
    }),
    logo: Joi.string().allow(null, '').optional(),
    currency: Joi.string().optional().valid('USD', 'EUR', 'GBP', 'INR', 'CAD', 'PKR', 'AED', 'SAR').messages({
      'any.only': 'Invalid currency. Must be one of: USD, EUR, GBP, INR, CAD, PKR, AED, SAR'
    }),
    timezone: Joi.string().optional().valid('EST', 'CST', 'PST', 'MST', 'IST', 'GMT', 'CET', 'JST', 'AEST').messages({
      'any.only': 'Invalid timezone. Must be one of: EST, CST, PST, MST, IST, GMT, CET, JST, AEST'
    }),
    locale: Joi.string().optional().valid('en-US', 'en-GB', 'en-IN', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA').messages({
      'any.only': 'Invalid locale. Must be one of: en-US, en-GB, en-IN, es-ES, fr-FR, de-DE, ar-SA'
    }),
    
    // Subscription Details
    planName: Joi.string().optional().trim(),
    startDate: Joi.date().optional().messages({
      'date.base': 'Start date must be a valid date'
    }),
    endDate: Joi.date().optional().messages({
      'date.base': 'End date must be a valid date'
    }),
    billingCycle: Joi.string().optional().valid('monthly', 'quarterly', 'yearly').messages({
      'any.only': 'Billing cycle must be one of: monthly, quarterly, yearly'
    }),
    
    // Business Settings
    defaultTaxPercentage: Joi.number().optional().min(0).max(100).messages({
      'number.base': 'Tax percentage must be a number',
      'number.min': 'Tax percentage cannot be negative',
      'number.max': 'Tax percentage cannot exceed 100'
    }),
    serviceChargePercentage: Joi.number().optional().min(0).max(100).messages({
      'number.base': 'Service charge percentage must be a number',
      'number.min': 'Service charge percentage cannot be negative',
      'number.max': 'Service charge percentage cannot exceed 100'
    }),
    minimumOrderValue: Joi.number().optional().min(0).messages({
      'number.base': 'Minimum order value must be a number',
      'number.min': 'Minimum order value cannot be negative'
    }),
    baseDeliveryCharges: Joi.number().optional().min(0).messages({
      'number.base': 'Base delivery charges must be a number',
      'number.min': 'Base delivery charges cannot be negative'
    }),
    
    // Legacy/Optional fields
    contactEmail: Joi.string().email().allow(null, '').optional().messages({
      'string.email': 'Invalid email format'
    }),
    phoneNumber: Joi.string().allow(null, '').optional(),
    address: Joi.string().max(500).allow(null, '').optional().messages({
      'string.max': 'Address cannot exceed 500 characters'
    })
  });

  const result = schema.validate(data, { abortEarly: false });
  return {
    error: result?.error,
    msg: result?.error?.details?.map(d => d.message).join(', ')
  };
};

// Update section validation
export const validateUpdateSection = (data) => {
  const schema = Joi.object({
    section: Joi.string().required().valid('basic', 'subscription', 'business').messages({
      'string.empty': 'Section is required',
      'any.only': 'Section must be one of: basic, subscription, business'
    }),
    
    // Basic section fields
    organizationName: Joi.string().min(2).max(200).optional().trim(),
    logo: Joi.string().allow(null, '').optional(),
    currency: Joi.string().optional().valid('USD', 'EUR', 'GBP', 'INR', 'CAD', 'PKR', 'AED', 'SAR'),
    timezone: Joi.string().optional().valid('EST', 'CST', 'PST', 'MST', 'IST', 'GMT', 'CET', 'JST', 'AEST'),
    locale: Joi.string().optional().valid('en-US', 'en-GB', 'en-IN', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA'),
    
    // Subscription section fields
    planName: Joi.string().optional().trim(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    billingCycle: Joi.string().optional().valid('monthly', 'quarterly', 'yearly'),
    
    // Business section fields
    defaultTaxPercentage: Joi.number().optional().min(0).max(100),
    serviceChargePercentage: Joi.number().optional().min(0).max(100),
    minimumOrderValue: Joi.number().optional().min(0),
    baseDeliveryCharges: Joi.number().optional().min(0)
  });

  const result = schema.validate(data, { abortEarly: false });
  return {
    error: result?.error,
    msg: result?.error?.details?.map(d => d.message).join(', ')
  };
};

// Calculate charges validation
export const validateCalculateCharges = (data) => {
  const schema = Joi.object({
    subtotal: Joi.number().required().min(0).messages({
      'number.base': 'Subtotal must be a number',
      'any.required': 'Subtotal is required',
      'number.min': 'Subtotal cannot be negative'
    }),
    includeDelivery: Joi.boolean().optional().default(false)
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

// Validate order validation
export const validateValidateOrder = (data) => {
  const schema = Joi.object({
    orderValue: Joi.number().required().min(0).messages({
      'number.base': 'Order value must be a number',
      'any.required': 'Order value is required',
      'number.min': 'Order value cannot be negative'
    })
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

export default {
  validateCreateorganizationSettings,
  validateUpdateorganizationSettings,
  validateUpdateSection,
  validateCalculateCharges,
  validateValidateOrder
};
