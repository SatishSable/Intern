const Joi = require('joi');
const { PRICING_TYPES, DISCOUNT_TYPES, DAYS_OF_WEEK } = require('../config/constants');

/**
 * Tier Schema
 */
const tierSchema = Joi.object({
    min_quantity: Joi.number()
        .integer()
        .min(0)
        .required(),
    max_quantity: Joi.number()
        .integer()
        .min(Joi.ref('min_quantity'))
        .required(),
    price: Joi.number()
        .min(0)
        .required()
});

/**
 * Dynamic Pricing Rule Schema
 */
const dynamicRuleSchema = Joi.object({
    name: Joi.string()
        .trim()
        .required(),
    days: Joi.array()
        .items(Joi.number().integer().min(0).max(6))
        .default([]),
    start_time: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'Start time must be in HH:mm format'
        }),
    end_time: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'End time must be in HH:mm format'
        }),
    price: Joi.number()
        .min(0)
        .required(),
    priority: Joi.number()
        .integer()
        .default(0)
});

/**
 * Availability Slot Schema
 */
const availabilitySlotSchema = Joi.object({
    day: Joi.number()
        .integer()
        .min(0)
        .max(6)
        .required(),
    start_time: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
    end_time: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
    max_bookings: Joi.number()
        .integer()
        .min(1)
        .default(1)
});

/**
 * Pricing Configuration Schema
 */
const pricingSchema = Joi.object({
    type: Joi.string()
        .valid(...Object.values(PRICING_TYPES))
        .required()
        .messages({
            'any.only': `Pricing type must be one of: ${Object.values(PRICING_TYPES).join(', ')}`
        }),

    base_price: Joi.number()
        .min(0)
        .when('type', {
            is: Joi.valid(PRICING_TYPES.STATIC, PRICING_TYPES.DISCOUNTED),
            then: Joi.required(),
            otherwise: Joi.optional()
        }),

    tiers: Joi.array()
        .items(tierSchema)
        .when('type', {
            is: PRICING_TYPES.TIERED,
            then: Joi.array().items(tierSchema).min(1).required(),
            otherwise: Joi.optional()
        }),

    discount: Joi.object({
        type: Joi.string()
            .valid(...Object.values(DISCOUNT_TYPES))
            .required(),
        value: Joi.number()
            .min(0)
            .required()
    }).when('type', {
        is: PRICING_TYPES.DISCOUNTED,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),

    dynamic_rules: Joi.array()
        .items(dynamicRuleSchema)
        .when('type', {
            is: PRICING_TYPES.DYNAMIC,
            then: Joi.array().items(dynamicRuleSchema).min(1).required(),
            otherwise: Joi.optional()
        }),

    default_price: Joi.number()
        .min(0)
        .when('type', {
            is: PRICING_TYPES.DYNAMIC,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
});

/**
 * Create Item Schema
 */
const createItemSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .required()
        .messages({
            'string.empty': 'Item name is required',
            'string.max': 'Item name cannot exceed 200 characters',
            'any.required': 'Item name is required'
        }),

    description: Joi.string()
        .trim()
        .max(1000)
        .allow('')
        .messages({
            'string.max': 'Description cannot exceed 1000 characters'
        }),

    image: Joi.string()
        .trim()
        .uri()
        .allow('')
        .messages({
            'string.uri': 'Image must be a valid URL'
        }),

    category: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid category ID format'
        }),

    subcategory: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid subcategory ID format'
        }),

    tax_applicable: Joi.boolean()
        .allow(null)
        .default(null),

    tax_percentage: Joi.number()
        .min(0)
        .max(100)
        .allow(null),

    pricing: pricingSchema.required(),

    is_bookable: Joi.boolean()
        .default(false),

    availability_slots: Joi.array()
        .items(availabilitySlotSchema)
        .default([]),

    booking_duration_minutes: Joi.number()
        .integer()
        .min(1)
        .default(60),

    addon_groups: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .default([]),

    is_active: Joi.boolean()
        .default(true),

    display_order: Joi.number()
        .integer()
        .min(0)
        .default(0),

    tags: Joi.array()
        .items(Joi.string().trim())
        .default([]),

    attributes: Joi.object()
        .pattern(Joi.string(), Joi.any())
        .default({})
}).or('category', 'subcategory').messages({
    'object.missing': 'Item must belong to either a category or subcategory'
});

/**
 * Update Item Schema
 */
const updateItemSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(200),

    description: Joi.string()
        .trim()
        .max(1000)
        .allow(''),

    image: Joi.string()
        .trim()
        .uri()
        .allow(''),

    category: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/),

    subcategory: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/),

    tax_applicable: Joi.boolean()
        .allow(null),

    tax_percentage: Joi.number()
        .min(0)
        .max(100)
        .allow(null),

    pricing: pricingSchema,

    is_bookable: Joi.boolean(),

    availability_slots: Joi.array()
        .items(availabilitySlotSchema),

    booking_duration_minutes: Joi.number()
        .integer()
        .min(1),

    addon_groups: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),

    is_active: Joi.boolean(),

    display_order: Joi.number()
        .integer()
        .min(0),

    tags: Joi.array()
        .items(Joi.string().trim()),

    attributes: Joi.object()
        .pattern(Joi.string(), Joi.any())
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Item ID Schema
 */
const itemIdSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid item ID format',
            'any.required': 'Item ID is required'
        })
});

/**
 * Price Calculation Query Schema
 */
const priceQuerySchema = Joi.object({
    quantity: Joi.number()
        .integer()
        .min(1)
        .default(1),
    datetime: Joi.date()
        .iso()
        .default(() => new Date()),
    addons: Joi.array()
        .items(Joi.object({
            addon_group: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
            addon_ids: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).required()
        }))
        .default([])
});

module.exports = {
    createItemSchema,
    updateItemSchema,
    itemIdSchema,
    priceQuerySchema,
    pricingSchema,
    availabilitySlotSchema
};
