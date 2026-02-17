import mongoose from 'mongoose';
import {
  tenantIdField,
  nameField,
  slugField,
  phoneNumberField,
  emailField,
  isActiveField,
  basicSchemaOptions
} from '../../../utils/commonFields.js';

const { Schema } = mongoose;

// Colors subdocument
const colorsSchema = new Schema({
  primary: { type: String, default: '#0078ae' },
  secondary: { type: String, default: '#e31837' },
  accent: { type: String, default: '#006491' },
  background: { type: String, default: '#ffffff' },
  dark: { type: String, default: '#0f172a' },
  text: { type: String, default: '#1a1a1a' },
  textLight: { type: String, default: '#6b7280' },
  success: { type: String, default: '#00a160' },
  error: { type: String, default: '#e31837' },
  warning: { type: String, default: '#ff9800' }
}, { _id: false });

// Fonts subdocument
const fontsSchema = new Schema({
  primary: { type: String, default: 'Poppins' },
  heading: { type: String, default: 'Poppins' },
  weights: {
    normal: { type: Number, default: 400 },
    medium: { type: Number, default: 500 },
    semibold: { type: Number, default: 600 },
    bold: { type: Number, default: 700 }
  }
}, { _id: false });

// Images subdocument
const imagesSchema = new Schema({
  logo: { type: String, default: null },
  favicon: { type: String, default: null },
  hero: { type: String, default: null },
  banners: [{ type: String }],
  homeImages: [{ type: String }]
}, { _id: false });

// Branding subdocument
const brandingSchema = new Schema({
  name: nameField(100, 'Brand name'),
  slug: slugField,
  colors: {
    type: colorsSchema,
    default: () => ({})
  },
  fonts: {
    type: fontsSchema,
    default: () => ({})
  },
  images: {
    type: imagesSchema,
    default: () => ({})
  }
}, { _id: false });

// Contact subdocument
const contactSchema = new Schema({
  phone: phoneNumberField,
  email: emailField,
  supportEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  phonePrefix: {
    type: String,
    default: '92'
  }
}, { _id: false });

// Social media subdocument
const socialMediaSchema = new Schema({
  facebook: { type: String, default: null },
  instagram: { type: String, default: null },
  twitter: { type: String, default: null },
  youtube: { type: String, default: null },
  linkedin: { type: String, default: null }
}, { _id: false });

// Business subdocument
const businessSchema = new Schema({
  currency: {
    type: String,
    default: 'PKR',
    uppercase: true
  },
  currencySymbol: {
    type: String,
    default: 'Rs.'
  },
  locale: {
    type: String,
    default: 'en-PK'
  },
  timezone: {
    type: String,
    default: 'Asia/Karachi'
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// SEO subdocument
const seoSchema = new Schema({
  title: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  description: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  keywords: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    trim: true
  }
}, { _id: false });

// Features subdocument
const featuresSchema = new Schema({
  delivery: { type: Boolean, default: true },
  pickup: { type: Boolean, default: true },
  dineIn: { type: Boolean, default: true },
  onlinePayment: { type: Boolean, default: false },
  cashOnDelivery: { type: Boolean, default: true },
  loyaltyProgram: { type: Boolean, default: false },
  giftCards: { type: Boolean, default: false },
  scheduling: { type: Boolean, default: false },
  vouchers: { type: Boolean, default: false }
}, { _id: false });

// Tenant Settings schema
const tenantSettingsSchema = new Schema({
  tenantId: {
    ...tenantIdField,
    unique: true
  },
  branding: {
    type: brandingSchema,
    required: true
  },
  contact: {
    type: contactSchema,
    required: true
  },
  socialMedia: {
    type: socialMediaSchema,
    default: () => ({})
  },
  business: {
    type: businessSchema,
    default: () => ({})
  },
  seo: {
    type: seoSchema,
    default: () => ({})
  },
  features: {
    type: featuresSchema,
    default: () => ({})
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: isActiveField
}, basicSchemaOptions);

// Indexes
tenantSettingsSchema.index({ tenantId: 1 }, { unique: true });
tenantSettingsSchema.index({ 'branding.slug': 1 });
tenantSettingsSchema.index({ isActive: 1 });

// Static method to find by tenant
tenantSettingsSchema.statics.findByTenant = function(tenantId) {
  return this.findOne({ tenantId, isActive: true });
};

// Static method to find by slug
tenantSettingsSchema.statics.findBySlug = function(slug) {
  return this.findOne({ 
    'branding.slug': slug.toLowerCase(),
    isActive: true 
  });
};

// Pre-save middleware to validate slug uniqueness
tenantSettingsSchema.pre('save', async function(next) {
  if (this.isModified('branding.slug')) {
    const existing = await this.constructor.findOne({
      'branding.slug': this.branding.slug,
      _id: { $ne: this._id }
    });
    
    if (existing) {
      return next(new Error('Slug already exists'));
    }
  }
  next();
});

export const TenantSettingsModel = mongoose.model('TenantSettings', tenantSettingsSchema);

export default TenantSettingsModel;
