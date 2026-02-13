import Joi from 'joi';

// Address validation schema
const addressSchema = Joi.object({
  street: Joi.string().max(200).required().messages({
    'string.empty': 'Street address is required',
    'string.max': 'Street address cannot exceed 200 characters'
  }),
  city: Joi.string().max(100).required().messages({
    'string.empty': 'City is required',
    'string.max': 'City name cannot exceed 100 characters'
  }),
  state: Joi.string().max(100).required().messages({
    'string.empty': 'State/Province is required',
    'string.max': 'State name cannot exceed 100 characters'
  }),
  postalCode: Joi.string().max(20).required().messages({
    'string.empty': 'Postal code is required',
    'string.max': 'Postal code cannot exceed 20 characters'
  }),
  country: Joi.string().max(100).required().messages({
    'string.empty': 'Country is required',
    'string.max': 'Country name cannot exceed 100 characters'
  })
});

// Location validation schema
const locationSchema = Joi.object({
  type: Joi.string().valid('Point').default('Point'),
  coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
    'array.length': 'Coordinates must contain exactly 2 values [longitude, latitude]',
    'any.required': 'Coordinates are required'
  })
});

// Break time validation schema
const breakSchema = Joi.object({
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'Invalid time format. Use HH:MM'
  }),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'Invalid time format. Use HH:MM'
  })
});

// Opening hours validation schema
const openingHoursSchema = Joi.object({
  day: Joi.string().valid('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY').required(),
  isOpen: Joi.boolean().default(true),
  openTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).when('isOpen', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'string.pattern.base': 'Invalid time format. Use HH:MM'
  }),
  closeTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).when('isOpen', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'string.pattern.base': 'Invalid time format. Use HH:MM'
  }),
  breaks: Joi.array().items(breakSchema).default([])
});

// Capabilities validation schema
const capabilitiesSchema = Joi.object({
  hasDineIn: Joi.boolean().default(false),
  hasTakeaway: Joi.boolean().default(true),
  hasTakeaway: Joi.boolean().default(true),
  hasDelivery: Joi.boolean().default(false),
  hasDriveThru: Joi.boolean().default(false),
  hasKiosk: Joi.boolean().default(false)
});

// Capacity validation schema
const capacitySchema = Joi.object({
  seatingCapacity: Joi.number().min(0).default(0),
  parkingSpots: Joi.number().min(0).default(0),
  driveThruLanes: Joi.number().min(0).default(0),
  maxConcurrentOrders: Joi.number().min(1).default(10)
});

// Delivery settings validation schema
const deliverySettingsSchema = Joi.object({
  deliveryRadius: Joi.number().min(0).max(100).default(5.0),
  estimatedDeliveryTime: Joi.number().min(1).default(30),
  minimumOrderValue: Joi.number().min(0).default(0),
  deliveryCharge: Joi.number().min(0).default(0)
});

// Create branch validation
export const validateCreateBranch = (data) => {
  const schema = Joi.object({
    // Testing fields (temporarily allowed for auth bypass)
    tenantId: Joi.string().optional(),
    userId: Joi.string().optional(),
    
    code: Joi.string().max(20).uppercase().pattern(/^[A-Z0-9-_]+$/).required().messages({
      'string.empty': 'Branch code is required',
      'string.pattern.base': 'Branch code can only contain uppercase letters, numbers, hyphens, and underscores'
    }),
    name: Joi.string().max(100).required().messages({
      'string.empty': 'Branch name is required',
      'string.max': 'Branch name cannot exceed 100 characters'
    }),
    address: addressSchema.required(),
    location: locationSchema.required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({
      'string.pattern.base': 'Invalid phone number format',
      'string.empty': 'Phone number is required'
    }),
    email: Joi.string().email().optional().messages({
      'string.email': 'Invalid email format'
    }),
    managerPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
      'string.pattern.base': 'Invalid phone number format'
    }),
    openingHours: Joi.array().items(openingHoursSchema).length(7).required().messages({
      'array.length': 'Opening hours must include all 7 days of the week'
    }),
    capabilities: capabilitiesSchema.optional(),
    capacity: capacitySchema.optional(),
    deliverySettings: deliverySettingsSchema.optional(),
    managerId: Joi.string().optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED', 'PENDING', 'SUSPENDED').default('ACTIVE')
  });

  const result = schema.validate(data, { abortEarly: false });
  return {
    error: result?.error,
    msg: result?.error?.details?.map(d => d.message).join(', ')
  };
};

// Update branch validation
export const validateUpdateBranch = (data) => {
  const schema = Joi.object({
    // Testing fields (temporarily allowed for auth bypass)
    tenantId: Joi.string().optional(),
    userId: Joi.string().optional(),
    
    code: Joi.string().max(20).uppercase().pattern(/^[A-Z0-9-_]+$/).optional().messages({
      'string.pattern.base': 'Branch code can only contain uppercase letters, numbers, hyphens, and underscores'
    }),
    name: Joi.string().max(100).optional().messages({
      'string.max': 'Branch name cannot exceed 100 characters'
    }),
    address: addressSchema.optional(),
    location: locationSchema.optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
      'string.pattern.base': 'Invalid phone number format'
    }),
    email: Joi.string().email().optional().messages({
      'string.email': 'Invalid email format'
    }),
    managerPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
      'string.pattern.base': 'Invalid phone number format'
    }),
    openingHours: Joi.array().items(openingHoursSchema).length(7).optional().messages({
      'array.length': 'Opening hours must include all 7 days of the week'
    }),
    capabilities: capabilitiesSchema.optional(),
    capacity: capacitySchema.optional(),
    deliverySettings: deliverySettingsSchema.optional(),
    managerId: Joi.string().optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED', 'PENDING', 'SUSPENDED').optional()
  });

  const result = schema.validate(data, { abortEarly: false });
  return {
    error: result?.error,
    msg: result?.error?.details?.map(d => d.message).join(', ')
  };
};

// Update branch status validation
export const validateUpdateStatus = (data) => {
  const schema = Joi.object({
    // Testing fields (temporarily allowed for auth bypass)
    tenantId: Joi.string().optional(),
    userId: Joi.string().optional(),
    
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED', 'PENDING', 'SUSPENDED').required()
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

// Update manager validation
export const validateUpdateManager = (data) => {
  const schema = Joi.object({
    // Testing fields (temporarily allowed for auth bypass)
    tenantId: Joi.string().optional(),
    userId: Joi.string().optional(),
    
    managerId: Joi.string().required().messages({
      'string.empty': 'Manager ID is required'
    })
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

// Nearby branches query validation
export const validateNearbyQuery = (data) => {
  const schema = Joi.object({
    longitude: Joi.number().min(-180).max(180).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    maxDistance: Joi.number().min(100).max(100000).default(10000) // in meters
  });

  const result = schema.validate(data);
  return {
    error: result?.error,
    msg: result?.error?.details?.[0]?.message
  };
};

export default {
  validateCreateBranch,
  validateUpdateBranch,
  validateUpdateStatus,
  validateUpdateManager,
  validateNearbyQuery
};
