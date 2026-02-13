import mongoose from 'mongoose';

const { Schema } = mongoose;




// TENANT REFERENCE FIELD

export const tenantIdField = {
  type: Schema.Types.ObjectId,
  ref: 'Tenant',
  required: [true, 'Tenant ID is required'],
  index: true
};


// SLUG FIELD (URL-friendly identifier)

export const slugField = {
  type: String,
  required: [true, 'Slug is required'],
  lowercase: true,
  trim: true,
  match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
};


// STATUS/ACTIVE FIELDS

export const isActiveField = {
  type: Boolean,
  default: true
};

export const statusField = (enumValues = ['ACTIVE', 'INACTIVE'], defaultValue = 'ACTIVE') => ({
  type: String,
  enum: enumValues,
  default: defaultValue
});


// ORDERING FIELDS

export const sortOrderField = {
  type: Number,
  default: 0,
  min: 0
};

export const displayOrderField = {
  type: Number,
  default: 0,
  min: 0
};


// VISIBILITY FIELDS (Multi-channel)

export const visibilityFields = {
  showOnPOS: {
    type: Boolean,
    default: true
  },
  showOnWeb: {
    type: Boolean,
    default: true
  },
  showOnApp: {
    type: Boolean,
    default: true
  }
};

export const visibilitySchema = new Schema({
  showOnPOS: {
    type: Boolean,
    default: true
  },
  showOnWeb: {
    type: Boolean,
    default: true
  },
  showOnMobile: {
    type: Boolean,
    default: true
  }
}, { _id: false });


// PRICING FIELDS

export const priceField = {
  type: Number,
  min: [0, 'Price cannot be negative'],
  default: null
};

export const costPriceField = {
  type: Number,
  min: [0, 'Cost price cannot be negative'],
  default: null
};


// IMAGE FIELDS

export const imageUrlField = {
  type: String,
  default: null
};

export const imagesSchema = new Schema({
  main: {
    type: String,
    required: [true, 'Main image is required']
  },
  gallery: [{
    type: String
  }]
}, { _id: false });


// DESCRIPTION FIELDS
export const descriptionField = (maxLength = 500) => ({
  type: String,
  trim: true,
  maxlength: [maxLength, `Description cannot exceed ${maxLength} characters`]
});


// NAME FIELDS

export const nameField = (maxLength = 100, fieldName = 'Name') => ({
  type: String,
  required: [true, `${fieldName} is required`],
  trim: true,
  maxlength: [maxLength, `${fieldName} cannot exceed ${maxLength} characters`]
});


// CONTACT FIELDS

export const phoneNumberField = {
  type: String,
  required: [true, 'Phone number is required'],
  trim: true,
  match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format']
};

export const emailField = {
  type: String,
  required: [true, 'Email is required'],
  trim: true,
  lowercase: true,
  match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
};

export const optionalEmailField = {
  type: String,
  trim: true,
  lowercase: true,
  match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
};

// ============================================
// ADDRESS SCHEMA
// ============================================
export const addressSchema = new Schema({
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true,
    maxlength: [200, 'Street address cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State/Province is required'],
    trim: true,
    maxlength: [100, 'State name cannot exceed 100 characters']
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    maxlength: [20, 'Postal code cannot exceed 20 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [100, 'Country name cannot exceed 100 characters']
  }
}, { _id: false });

// ============================================
// GEOLOCATION SCHEMA (GeoJSON)
// ============================================
export const locationSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: [true, 'Coordinates are required'],
    validate: {
      validator: function(coords) {
        return coords.length === 2 && 
               coords[0] >= -180 && coords[0] <= 180 && // longitude
               coords[1] >= -90 && coords[1] <= 90;     // latitude
      },
      message: 'Invalid coordinates. Format: [longitude, latitude]'
    }
  }
}, { _id: false });

// ============================================
// TIME FIELDS
// ============================================
export const timeField = {
  type: String,
  match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
};

export const preparationTimeField = {
  type: Number, // in minutes
  min: [0, 'Preparation time cannot be negative'],
  default: 15
};

// ============================================
// SKU FIELD
// ============================================
export const skuField = {
  type: String,
  trim: true,
  uppercase: true,
  sparse: true
};

export const requiredSkuField = {
  type: String,
  required: [true, 'SKU is required'],
  unique: true,
  uppercase: true,
  trim: true
};

// ============================================
// SCHEMA OPTIONS (for timestamps and virtuals)
// ============================================
export const schemaOptions = {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
};

export const basicSchemaOptions = {
  timestamps: true
};

// ============================================
// REFERENCE FIELDS
// ============================================
export const createReferenceField = (modelName, fieldName = `${modelName} ID`, required = true) => ({
  type: Schema.Types.ObjectId,
  ref: modelName,
  required: required ? [true, `${fieldName} is required`] : false,
  index: true
});

export const createOptionalReferenceField = (modelName) => ({
  type: Schema.Types.ObjectId,
  ref: modelName,
  default: null,
  index: true
});

// ============================================
// ARRAY REFERENCE FIELDS
// ============================================
export const createArrayReferenceField = (modelName) => [{
  type: Schema.Types.ObjectId,
  ref: modelName
}];

// ============================================
// TAGS FIELD
// ============================================
export const tagsField = [{
  type: String,
  trim: true,
  lowercase: true
}];

// ============================================
// ALLERGENS FIELD
// ============================================
export const allergensField = [{
  type: String,
  enum: ['GLUTEN', 'DAIRY', 'EGGS', 'NUTS', 'PEANUTS', 'SOY', 'FISH', 'SHELLFISH', 'SESAME'],
  uppercase: true
}];

// ============================================
// NUTRITION SCHEMA
// ============================================
export const nutritionSchema = new Schema({
  calories: {
    type: Number,
    min: [0, 'Calories cannot be negative'],
    default: null
  },
  protein: {
    type: Number,
    min: [0, 'Protein cannot be negative'],
    default: null
  },
  carbs: {
    type: Number,
    min: [0, 'Carbs cannot be negative'],
    default: null
  },
  fat: {
    type: Number,
    min: [0, 'Fat cannot be negative'],
    default: null
  }
}, { _id: false });

// ============================================
// EXPORT ALL
// ============================================
export default {
  tenantIdField,
  slugField,
  isActiveField,
  statusField,
  sortOrderField,
  displayOrderField,
  visibilityFields,
  visibilitySchema,
  priceField,
  costPriceField,
  imageUrlField,
  imagesSchema,
  descriptionField,
  nameField,
  phoneNumberField,
  emailField,
  optionalEmailField,
  addressSchema,
  locationSchema,
  timeField,
  preparationTimeField,
  skuField,
  requiredSkuField,
  schemaOptions,
  basicSchemaOptions,
  createReferenceField,
  createOptionalReferenceField,
  createArrayReferenceField,
  tagsField,
  allergensField,
  nutritionSchema
};
