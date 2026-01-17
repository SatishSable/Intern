const Joi = require('joi');

/**
 * Category Validation Schemas
 */

// Create category
const createCategorySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Category name is required',
            'string.max': 'Category name cannot exceed 100 characters',
            'any.required': 'Category name is required'
        }),

    description: Joi.string()
        .trim()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),

    image: Joi.string()
        .trim()
        .uri()
        .allow('')
        .messages({
            'string.uri': 'Image must be a valid URL'
        }),

    tax_applicable: Joi.boolean()
        .default(false),

    tax_percentage: Joi.number()
        .min(0)
        .max(100)
        .when('tax_applicable', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'number.min': 'Tax percentage cannot be negative',
            'number.max': 'Tax percentage cannot exceed 100',
            'any.required': 'Tax percentage is required when tax is applicable'
        }),

    is_active: Joi.boolean()
        .default(true),

    display_order: Joi.number()
        .integer()
        .min(0)
        .default(0)
});

// Update category
const updateCategorySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .messages({
            'string.empty': 'Category name cannot be empty',
            'string.max': 'Category name cannot exceed 100 characters'
        }),

    description: Joi.string()
        .trim()
        .max(500)
        .allow(''),

    image: Joi.string()
        .trim()
        .uri()
        .allow(''),

    tax_applicable: Joi.boolean(),

    tax_percentage: Joi.number()
        .min(0)
        .max(100),

    is_active: Joi.boolean(),

    display_order: Joi.number()
        .integer()
        .min(0)
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

// Category ID validation
const categoryIdSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid category ID format',
            'any.required': 'Category ID is required'
        })
});

module.exports = {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema
};
