/**
 * Application Constants
 */

// Pricing Types
const PRICING_TYPES = {
    STATIC: 'STATIC',           // Fixed price
    TIERED: 'TIERED',           // Price based on usage tiers
    COMPLIMENTARY: 'COMPLIMENTARY', // Always free
    DISCOUNTED: 'DISCOUNTED',   // Base price + flat/% discount
    DYNAMIC: 'DYNAMIC'          // Time-based pricing
};

// Discount Types
const DISCOUNT_TYPES = {
    FLAT: 'FLAT',               // Flat amount off
    PERCENTAGE: 'PERCENTAGE'    // Percentage off
};

// Days of Week
const DAYS_OF_WEEK = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
};

// Booking Status
const BOOKING_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED'
};

// Add-on Types
const ADDON_TYPES = {
    OPTIONAL: 'OPTIONAL',
    MANDATORY: 'MANDATORY'
};

// Addon Group Selection Types
const ADDON_GROUP_SELECTION = {
    SINGLE: 'SINGLE',           // Choose 1 from group
    MULTIPLE: 'MULTIPLE'        // Choose multiple from group
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Sort Orders
const SORT_ORDER = {
    ASC: 1,
    DESC: -1
};

module.exports = {
    PRICING_TYPES,
    DISCOUNT_TYPES,
    DAYS_OF_WEEK,
    BOOKING_STATUS,
    ADDON_TYPES,
    ADDON_GROUP_SELECTION,
    PAGINATION,
    SORT_ORDER
};
