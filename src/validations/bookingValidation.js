const Joi = require('joi');
const { BOOKING_STATUS } = require('../config/constants');

/**
 * Selected Add-on Schema
 */
const selectedAddonSchema = Joi.object({
    addon_group: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid add-on group ID format'
        }),

    addon_ids: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required()
});

/**
 * Create Booking Schema
 */
const createBookingSchema = Joi.object({
    item: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid item ID format',
            'any.required': 'Item is required'
        }),

    customer_name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Customer name is required',
            'string.max': 'Customer name cannot exceed 100 characters',
            'any.required': 'Customer name is required'
        }),

    customer_email: Joi.string()
        .trim()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email',
            'any.required': 'Customer email is required'
        }),

    customer_phone: Joi.string()
        .trim()
        .max(20)
        .allow(''),

    booking_date: Joi.date()
        .iso()
        .min('now')
        .required()
        .messages({
            'date.min': 'Booking date cannot be in the past',
            'any.required': 'Booking date is required'
        }),

    start_time: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'Start time must be in HH:mm format',
            'any.required': 'Start time is required'
        }),

    end_time: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'End time must be in HH:mm format',
            'any.required': 'End time is required'
        }),

    quantity: Joi.number()
        .integer()
        .min(1)
        .default(1),

    selected_addons: Joi.array()
        .items(selectedAddonSchema)
        .default([]),

    notes: Joi.string()
        .trim()
        .max(500)
        .allow('')
});

/**
 * Update Booking Schema
 */
const updateBookingSchema = Joi.object({
    customer_name: Joi.string()
        .trim()
        .min(1)
        .max(100),

    customer_email: Joi.string()
        .trim()
        .email(),

    customer_phone: Joi.string()
        .trim()
        .max(20)
        .allow(''),

    booking_date: Joi.date()
        .iso()
        .min('now'),

    start_time: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),

    end_time: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),

    quantity: Joi.number()
        .integer()
        .min(1),

    selected_addons: Joi.array()
        .items(selectedAddonSchema),

    status: Joi.string()
        .valid(...Object.values(BOOKING_STATUS)),

    notes: Joi.string()
        .trim()
        .max(500)
        .allow('')
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Booking ID Schema
 */
const bookingIdSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid booking ID format',
            'any.required': 'Booking ID is required'
        })
});

/**
 * Cancel Booking Schema
 */
const cancelBookingSchema = Joi.object({
    reason: Joi.string()
        .trim()
        .max(500)
        .allow('')
});

/**
 * Booking Query Schema
 */
const bookingQuerySchema = Joi.object({
    item: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/),

    customer_email: Joi.string()
        .email(),

    status: Joi.string()
        .valid(...Object.values(BOOKING_STATUS)),

    date_from: Joi.date()
        .iso(),

    date_to: Joi.date()
        .iso()
        .min(Joi.ref('date_from')),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),

    sort: Joi.string()
});

/**
 * Check Availability Schema
 */
const checkAvailabilitySchema = Joi.object({
    item: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),

    date: Joi.date()
        .iso()
        .required()
});

module.exports = {
    createBookingSchema,
    updateBookingSchema,
    bookingIdSchema,
    cancelBookingSchema,
    bookingQuerySchema,
    checkAvailabilitySchema,
    selectedAddonSchema
};
