// ============================================
// APPLICATION STATUS
// ============================================
export const APP_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    DRAFT: 'DRAFT',
    ARCHIVED: 'ARCHIVED',
    PENDING: 'PENDING',
    SUSPENDED: 'SUSPENDED'
};

// ============================================
// USER ROLES
// ============================================
export const USER_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
    CUSTOMER: 'CUSTOMER',
    GUEST: 'GUEST'
};

// ============================================
// ORDER STATUS
// ============================================
export const ORDER_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PREPARING: 'PREPARING',
    READY: 'READY',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED'
};

// ============================================
// PAYMENT STATUS
// ============================================
export const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
    CANCELLED: 'CANCELLED'
};

// ============================================
// PAYMENT METHODS
// ============================================
export const PAYMENT_METHODS = {
    CASH: 'CASH',
    CARD: 'CARD',
    ONLINE: 'ONLINE',
    WALLET: 'WALLET',
    UPI: 'UPI',
    NET_BANKING: 'NET_BANKING'
};

// ============================================
// DELIVERY TYPES
// ============================================
export const DELIVERY_TYPES = {
    DINE_IN: 'DINE_IN',
    TAKEAWAY: 'TAKEAWAY',
    DELIVERY: 'DELIVERY',
    DRIVE_THRU: 'DRIVE_THRU'
};

// ============================================
// SUBSCRIPTION STATUS
// ============================================
export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    TRIAL: 'TRIAL',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
    SUSPENDED: 'SUSPENDED'
};

// ============================================
// DAYS OF WEEK
// ============================================
export const DAYS_OF_WEEK = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
};

export const DAY_NAMES = [
    'Sunday',
    'Monday', 
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

// ============================================
// MEDIA TYPES
// ============================================
export const MEDIA_TYPES = {
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    DOCUMENT: 'DOCUMENT',
    AUDIO: 'AUDIO'
};

// ============================================
// FILE EXTENSIONS TO MEDIA TYPE MAPPING
// ============================================
export const MEDIA_TYPE_MAP = {
    // Images
    'jpg': 'IMAGE', 'jpeg': 'IMAGE', 'png': 'IMAGE', 'gif': 'IMAGE',
    'webp': 'IMAGE', 'bmp': 'IMAGE', 'svg': 'IMAGE',
    // Videos
    'mp4': 'VIDEO', 'mov': 'VIDEO', 'avi': 'VIDEO', 'mkv': 'VIDEO',
    // Documents
    'pdf': 'DOCUMENT', 'doc': 'DOCUMENT', 'docx': 'DOCUMENT',
    'xls': 'DOCUMENT', 'xlsx': 'DOCUMENT', 'csv': 'DOCUMENT',
    // Audio
    'mp3': 'AUDIO', 'wav': 'AUDIO', 'ogg': 'AUDIO'
};

// ============================================
// NOTIFICATION TYPES
// ============================================
export const NOTIFICATION_TYPES = {
    ORDER_PLACED: 'ORDER_PLACED',
    ORDER_CONFIRMED: 'ORDER_CONFIRMED',
    ORDER_READY: 'ORDER_READY',
    ORDER_DELIVERED: 'ORDER_DELIVERED',
    PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
    SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED'
};

// ============================================
// ACTIVITY LOG TYPES
// ============================================
export const ACTIVITY_TYPES = {
    CREATED: 'CREATED',
    UPDATED: 'UPDATED',
    DELETED: 'DELETED',
    ARCHIVED: 'ARCHIVED',
    RESTORED: 'RESTORED',
    STATUS_CHANGED: 'STATUS_CHANGED',
    ASSIGNED: 'ASSIGNED',
    UNASSIGNED: 'UNASSIGNED'
};

// ============================================
// EXPORT ALL
// ============================================
export default {
    APP_STATUS,
    USER_ROLES,
    ORDER_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHODS,
    DELIVERY_TYPES,
    SUBSCRIPTION_STATUS,
    DAYS_OF_WEEK,
    DAY_NAMES,
    MEDIA_TYPES,
    MEDIA_TYPE_MAP,
    NOTIFICATION_TYPES,
    ACTIVITY_TYPES
};
