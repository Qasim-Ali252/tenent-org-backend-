import GlobalService from '../../../utils/globalService.js';
import OrganizationSettingsModel from './model.js';
import { apiError } from '../../../utils/index.js';

/**
 * OrganizationSettingsService - Service layer for organization settings operations
 * Extends GlobalService for common CRUD operations
 */
class OrganizationSettingsService extends GlobalService {
  constructor() {
    super(OrganizationSettingsModel);
  }

  /**
   * Get organization settings by tenant ID
   * @param {String} tenantId - Tenant ID
   * @returns {Object|null} Organization settings or null
   */
  async getByTenant(tenantId) {
    return await this.getOneByConditions(
      { tenantId, status: 'ACTIVE' },
      {},
      tenantId
    );
  }

  /**
   * Get organization settings by ID
   * @param {String} settingsId - Settings ID
   * @param {String} tenantId - Tenant ID
   * @returns {Object|null} Organization settings or null
   */
  async getSettingsById(settingsId, tenantId) {
    return await this.getById(settingsId, {}, tenantId);
  }

  /**
   * Check if settings exist for tenant
   * @param {String} tenantId - Tenant ID
   * @returns {Boolean} True if settings exist
   */
  async settingsExist(tenantId) {
    return await this.exists({ tenantId }, tenantId);
  }

  /**
   * Create organization settings
   * @param {String} tenantId - Tenant ID
   * @param {Object} data - Settings data
   * @param {String} userId - User ID creating the settings
   * @returns {Object} Created settings
   */
  async createSettings(tenantId, data, userId) {
    // Check if settings already exist for this tenant
    const existing = await this.settingsExist(tenantId);
    
    if (existing) {
      throw apiError.badRequest('Organization settings already exist for this tenant');
    }

    // Validate dates
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      throw apiError.badRequest('End date must be after start date');
    }

    // Create settings
    return await this.create({
      ...data,
      tenantId,
      addedUser: userId,
      modifiedUser: userId
    }, {});
  }

  /**
   * Update Organization settings
   * @param {String} settingsId - Settings ID
   * @param {String} tenantId - Tenant ID
   * @param {Object} data - Update data
   * @param {String} userId - User ID modifying the settings
   * @returns {Object} Updated settings
   */
  async updateSettings(settingsId, tenantId, data, userId) {
    // Get existing settings
    const settings = await this.getSettingsById(settingsId, tenantId);
    
    if (!settings) {
      throw apiError.notFound('Organization settings not found');
    }

    // Validate dates if being updated
    if (data.startDate || data.endDate) {
      const startDate = data.startDate ? new Date(data.startDate) : settings.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : settings.endDate;
      
      if (endDate <= startDate) {
        throw apiError.badRequest('End date must be after start date');
      }
    }

    // Update settings
    return await this.update(
      settingsId,
      {
        ...data,
        modifiedUser: userId
      },
      {},
      tenantId
    );
  }

  /**
   * Update specific section of settings
   * @param {String} settingsId - Settings ID
   * @param {String} tenantId - Tenant ID
   * @param {String} section - Section to update (basic, subscription, business)
   * @param {Object} data - Section data
   * @param {String} userId - User ID modifying the settings
   * @returns {Object} Updated settings
   */
  async updateSection(settingsId, tenantId, section, data, userId) {
    const settings = await this.getSettingsById(settingsId, tenantId);
    
    if (!settings) {
      throw apiError.notFound('Organization settings not found');
    }

    let updateData = {};

    switch (section) {
      case 'basic':
        updateData = {
          practiceName: data.practiceName,
          logo: data.logo,
          currency: data.currency,
          timezone: data.timezone,
          locale: data.locale
        };
        break;
      
      case 'subscription':
        // Validate dates
        const startDate = data.startDate ? new Date(data.startDate) : settings.startDate;
        const endDate = data.endDate ? new Date(data.endDate) : settings.endDate;
        
        if (endDate <= startDate) {
          throw apiError.badRequest('End date must be after start date');
        }
        
        updateData = {
          planName: data.planName,
          startDate: data.startDate,
          endDate: data.endDate,
          billingCycle: data.billingCycle
        };
        break;
      
      case 'business':
        updateData = {
          defaultTaxPercentage: data.defaultTaxPercentage,
          serviceChargePercentage: data.serviceChargePercentage,
          minimumOrderValue: data.minimumOrderValue,
          baseDeliveryCharges: data.baseDeliveryCharges
        };
        break;
      
      default:
        throw apiError.badRequest('Invalid section. Must be: basic, subscription, or business');
    }

    return await this.update(
      settingsId,
      {
        ...updateData,
        modifiedUser: userId
      },
      {},
      tenantId
    );
  }

  /**
   * Update logo
   * @param {String} settingsId - Settings ID
   * @param {String} tenantId - Tenant ID
   * @param {String} logoUrl - Logo URL or base64
   * @param {String} userId - User ID modifying the settings
   * @returns {Object} Updated settings
   */
  async updateLogo(settingsId, tenantId, logoUrl, userId) {
    return await this.update(
      settingsId,
      {
        logo: logoUrl,
        modifiedUser: userId
      },
      {},
      tenantId
    );
  }

  /**
   * Delete logo
   * @param {String} settingsId - Settings ID
   * @param {String} tenantId - Tenant ID
   * @param {String} userId - User ID modifying the settings
   * @returns {Object} Updated settings
   */
  async deleteLogo(settingsId, tenantId, userId) {
    return await this.update(
      settingsId,
      {
        logo: null,
        modifiedUser: userId
      },
      {},
      tenantId
    );
  }

  /**
   * Delete Organization settings (soft delete)
   * @param {String} settingsId - Settings ID
   * @param {String} tenantId - Tenant ID
   * @param {String} userId - User ID deleting the settings
   * @returns {Object} Updated settings
   */
  async deleteSettings(settingsId, tenantId, userId) {
    return await this.update(
      settingsId,
      {
        status: 'ARCHIVED',
        modifiedUser: userId
      },
      {},
      tenantId
    );
  }

  /**
   * Restore archived settings
   * @param {String} settingsId - Settings ID
   * @param {String} tenantId - Tenant ID
   * @param {String} userId - User ID restoring the settings
   * @returns {Object} Updated settings
   */
  async restoreSettings(settingsId, tenantId, userId) {
    return await this.update(
      settingsId,
      {
        status: 'ACTIVE',
        modifiedUser: userId
      },
      {},
      tenantId
    );
  }

  /**
   * Hard delete Organization settings
   * @param {String} settingsId - Settings ID
   * @param {String} tenantId - Tenant ID
   * @returns {Object} Deleted settings
   */
  async hardDeleteSettings(settingsId, tenantId) {
    return await this.hardDeleteOne(settingsId, tenantId);
  }

  /**
   * Check if subscription is active
   * @param {String} tenantId - Tenant ID
   * @returns {Boolean} True if subscription is active
   */
  async isSubscriptionActive(tenantId) {
    const settings = await this.getByTenant(tenantId);
    
    if (!settings) {
      return false;
    }

    const now = new Date();
    return settings.startDate <= now && settings.endDate >= now && settings.status === 'ACTIVE';
  }

  /**
   * Get subscription status
   * @param {String} tenantId - Tenant ID
   * @returns {Object} Subscription status details
   */
  async getSubscriptionStatus(tenantId) {
    const settings = await this.getByTenant(tenantId);
    
    if (!settings) {
      return {
        exists: false,
        active: false,
        daysRemaining: 0
      };
    }

    const now = new Date();
    const isActive = settings.startDate <= now && settings.endDate >= now && settings.status === 'ACTIVE';
    const diffTime = settings.endDate - now;
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      exists: true,
      active: isActive,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      startDate: settings.startDate,
      endDate: settings.endDate,
      planName: settings.planName,
      billingCycle: settings.billingCycle
    };
  }

  /**
   * Calculate order charges
   * @param {String} tenantId - Tenant ID
   * @param {Number} subtotal - Order subtotal
   * @param {Boolean} includeDelivery - Include delivery charges
   * @returns {Object} Calculated charges
   */
  async calculateOrderCharges(tenantId, subtotal, includeDelivery = false) {
    const settings = await this.getByTenant(tenantId);
    
    if (!settings) {
      throw apiError.notFound('Organization settings not found for this tenant');
    }

    const tax = (subtotal * settings.defaultTaxPercentage) / 100;
    const serviceCharge = (subtotal * settings.serviceChargePercentage) / 100;
    const delivery = includeDelivery ? settings.baseDeliveryCharges : 0;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      serviceCharge: Math.round(serviceCharge * 100) / 100,
      delivery: Math.round(delivery * 100) / 100,
      total: Math.round((subtotal + tax + serviceCharge + delivery) * 100) / 100,
      currency: settings.currency
    };
  }

  /**
   * Validate order value
   * @param {String} tenantId - Tenant ID
   * @param {Number} orderValue - Order value to validate
   * @returns {Object} Validation result
   */
  async validateOrderValue(tenantId, orderValue) {
    const settings = await this.getByTenant(tenantId);
    
    if (!settings) {
      throw apiError.notFound('Organization settings not found for this tenant');
    }

    const meetsMinimum = orderValue >= settings.minimumOrderValue;

    return {
      valid: meetsMinimum,
      orderValue,
      minimumRequired: settings.minimumOrderValue,
      shortfall: meetsMinimum ? 0 : settings.minimumOrderValue - orderValue,
      currency: settings.currency
    };
  }
}

// Export singleton instance
export default new OrganizationSettingsService();
