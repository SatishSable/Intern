const Joi = require('joi');

/**
 * Subcategory Validation Schemas
 */

// Create subcategory
const createSubcategorySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Subcategory name is required',
            'string.max': 'Subcategory name cannot exceed 100 characters',
            'any.required': 'Subcategory name is required'
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

    category: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid category ID format',
            'any.required': 'Category is required'
        }),

    // Tax settings are optional - if not provided, inherits from category
    tax_applicable: Joi.boolean()
        .allow(null)
        .default(null),

    tax_percentage: Joi.number()
        .min(0)
        .max(100)
        .allow(null)
        .messages({
            'number.min': 'Tax percentage cannot be negative',
            'number.max': 'Tax percentage cannot exceed 100'
        }),

    is_active: Joi.boolean()
        .default(true),

    display_order: Joi.number()
        .integer()
        .min(0)
        .default(0)
});

// Update subcategory
const updateSubcategorySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .messages({
            'string.empty': 'Subcategory name cannot be empty',
            'string.max': 'Subcategory name cannot exceed 100 characters'
        }),

    description: Joi.string()
        .trim()
        .max(500)
        .allow(''),

    image: Joi.string()
        .trim()
        .uri()
        .allow(''),

    category: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid category ID format'
        }),

    tax_applicable: Joi.boolean()
        .allow(null),

    tax_percentage: Joi.number()
        .min(0)
        .max(100)
        .allow(null),

    is_active: Joi.boolean(),

    display_order: Joi.number()
        .integer()
        .min(0)
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

// Subcategory ID validation
const subcategoryIdSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid subcategory ID format',
            'any.required': 'Subcategory ID is required'
        })
});

// Category ID for filtering
const categoryFilterSchema = Joi.object({
    categoryId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid category ID format',
            'any.required': 'Category ID is required'
        })
});

module.exports = {
    createSubcategorySchema,
    updateSubcategorySchema,
    subcategoryIdSchema,
    categoryFilterSchema
};
