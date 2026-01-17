const Joi = require('joi');
const { ADDON_TYPES, ADDON_GROUP_SELECTION } = require('../config/constants');

/**
 * Add-on Schema
 */
const addonSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Add-on name is required',
            'string.max': 'Add-on name cannot exceed 100 characters'
        }),

    description: Joi.string()
        .trim()
        .max(500)
        .allow(''),

    price: Joi.number()
        .min(0)
        .required()
        .messages({
            'any.required': 'Add-on price is required',
            'number.min': 'Price cannot be negative'
        }),

    is_active: Joi.boolean()
        .default(true)
});

/**
 * Create Add-on Group Schema
 */
const createAddonGroupSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Add-on group name is required',
            'string.max': 'Add-on group name cannot exceed 100 characters',
            'any.required': 'Add-on group name is required'
        }),

    description: Joi.string()
        .trim()
        .max(500)
        .allow(''),

    type: Joi.string()
        .valid(...Object.values(ADDON_TYPES))
        .default(ADDON_TYPES.OPTIONAL),

    selection_type: Joi.string()
        .valid(...Object.values(ADDON_GROUP_SELECTION))
        .default(ADDON_GROUP_SELECTION.SINGLE),

    min_selections: Joi.number()
        .integer()
        .min(0)
        .default(0),

    max_selections: Joi.number()
        .integer()
        .min(1)
        .default(1),

    addons: Joi.array()
        .items(addonSchema)
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one add-on is required',
            'any.required': 'Add-ons are required'
        }),

    is_active: Joi.boolean()
        .default(true),

    display_order: Joi.number()
        .integer()
        .min(0)
        .default(0)
});

/**
 * Update Add-on Group Schema
 */
const updateAddonGroupSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100),

    description: Joi.string()
        .trim()
        .max(500)
        .allow(''),

    type: Joi.string()
        .valid(...Object.values(ADDON_TYPES)),

    selection_type: Joi.string()
        .valid(...Object.values(ADDON_GROUP_SELECTION)),

    min_selections: Joi.number()
        .integer()
        .min(0),

    max_selections: Joi.number()
        .integer()
        .min(1),

    addons: Joi.array()
        .items(addonSchema)
        .min(1),

    is_active: Joi.boolean(),

    display_order: Joi.number()
        .integer()
        .min(0)
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Add-on Group ID Schema
 */
const addonGroupIdSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid add-on group ID format',
            'any.required': 'Add-on group ID is required'
        })
});

/**
 * Add-on to Group Schema
 */
const addAddonToGroupSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required(),

    description: Joi.string()
        .trim()
        .max(500)
        .allow(''),

    price: Joi.number()
        .min(0)
        .required(),

    is_active: Joi.boolean()
        .default(true)
});

module.exports = {
    createAddonGroupSchema,
    updateAddonGroupSchema,
    addonGroupIdSchema,
    addAddonToGroupSchema,
    addonSchema
};
