const {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema
} = require('./categoryValidation');

const {
    createSubcategorySchema,
    updateSubcategorySchema,
    subcategoryIdSchema,
    categoryFilterSchema
} = require('./subcategoryValidation');

const {
    createItemSchema,
    updateItemSchema,
    itemIdSchema,
    priceQuerySchema,
    pricingSchema,
    availabilitySlotSchema
} = require('./itemValidation');

const {
    createAddonGroupSchema,
    updateAddonGroupSchema,
    addonGroupIdSchema,
    addAddonToGroupSchema,
    addonSchema
} = require('./addonValidation');

const {
    createBookingSchema,
    updateBookingSchema,
    bookingIdSchema,
    cancelBookingSchema,
    bookingQuerySchema,
    checkAvailabilitySchema,
    selectedAddonSchema
} = require('./bookingValidation');

module.exports = {
    // Category
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema,

    // Subcategory
    createSubcategorySchema,
    updateSubcategorySchema,
    subcategoryIdSchema,
    categoryFilterSchema,

    // Item
    createItemSchema,
    updateItemSchema,
    itemIdSchema,
    priceQuerySchema,
    pricingSchema,
    availabilitySlotSchema,

    // Add-on
    createAddonGroupSchema,
    updateAddonGroupSchema,
    addonGroupIdSchema,
    addAddonToGroupSchema,
    addonSchema,

    // Booking
    createBookingSchema,
    updateBookingSchema,
    bookingIdSchema,
    cancelBookingSchema,
    bookingQuerySchema,
    checkAvailabilitySchema,
    selectedAddonSchema
};
