import moment from 'moment';
import mongoose from 'mongoose';
import { APP_STATUS } from '../constants/index.js';

/**
 * Global schema fields that should be added to all models
 * Provides audit trail, status management, and formatted dates
 * 
 * Usage in models:
 * import globalSchema from '../../utils/globalSchema.js';
 * mySchema.add(globalSchema);
 */
export const globalObj = {
    // Status management
    status: {
        type: String,
        enum: Object.values(APP_STATUS),
        default: APP_STATUS.ACTIVE,
        index: true
    },

    // Audit trail - WHO created/modified
    addedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    modifiedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    modifiedAt: {
        type: Date,
        default: null
    },

    // Display dates (pre-formatted for frontend)
    displayCreatedAt: {
        type: String,
        default: null
    },
    displayUpdatedAt: {
        type: String,
        default: null
    },
    displayModifiedAt: {
        type: String,
        default: null
    }
};

// Create the schema
const globalSchema = new mongoose.Schema(globalObj);

/**
 * Helper function to format dates consistently
 * @param {Date} date - Date to format
 * @returns {String|null} - Formatted date string or null
 */
export const formatDate = (date) => {
    return moment(date).isValid() 
        ? moment.utc(date).format('MM-DD-YYYY HH:mm:ss') 
        : null;
};

/**
 * Pre-save hook - automatically update audit fields
 * Runs before document.save()
 */
globalSchema.pre('save', function (next) {
    // On creation, set display created date
    if (this.isNew) {
        this.displayCreatedAt = formatDate(this.createdAt);
    }
    
    // Always update these on save
    this.displayUpdatedAt = formatDate(this.updatedAt);
    this.modifiedAt = new Date();
    this.displayModifiedAt = formatDate(this.modifiedAt);
    
    next();
});

/**
 * Pre-update hook for findOneAndUpdate
 * Automatically updates modifiedAt and display dates
 */
globalSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();

    if (update.$set) {
        update.$set.modifiedAt = new Date();
        update.$set.displayModifiedAt = formatDate(update.$set.modifiedAt);
        
        if (update.$set.updatedAt) {
            update.$set.displayUpdatedAt = formatDate(update.$set.updatedAt);
        }
    }

    next();
});

/**
 * Pre-update hook for updateOne
 * Automatically updates modifiedAt and display dates
 */
globalSchema.pre('updateOne', function (next) {
    const update = this.getUpdate();

    if (update.$set) {
        update.$set.modifiedAt = new Date();
        update.$set.displayModifiedAt = formatDate(update.$set.modifiedAt);
        
        if (update.$set.updatedAt) {
            update.$set.displayUpdatedAt = formatDate(update.$set.updatedAt);
        }
        if (update.$set.createdAt && !update.$set.displayCreatedAt) {
            update.$set.displayCreatedAt = formatDate(update.$set.createdAt);
        }
    }

    next();
});

/**
 * Pre-update hook for updateMany
 * Automatically updates modifiedAt and display dates
 */
globalSchema.pre('updateMany', function (next) {
    const update = this.getUpdate();

    if (update.$set) {
        update.$set.modifiedAt = new Date();
        update.$set.displayModifiedAt = formatDate(update.$set.modifiedAt);
        
        if (update.$set.updatedAt) {
            update.$set.displayUpdatedAt = formatDate(update.$set.updatedAt);
        }
        if (update.$set.createdAt && !update.$set.displayCreatedAt) {
            update.$set.displayCreatedAt = formatDate(update.$set.createdAt);
        }
    }

    next();
});

export default globalSchema;
