const mongoose = require('mongoose');

/**
 * Tax Engine
 * Handles tax inheritance and calculations
 * 
 * Tax Inheritance Chain: Item Tax → Subcategory Tax → Category Tax
 */
class TaxEngine {
    /**
     * Get effective tax for an item with inheritance
     * @param {Object} item - The item document
     * @returns {Object} Tax configuration with source information
     */
    static async getEffectiveTax(item) {
        // If item has its own tax settings defined (not null), use them
        if (item.tax_applicable !== null && item.tax_applicable !== undefined) {
            return {
                tax_applicable: item.tax_applicable,
                tax_percentage: item.tax_applicable ? (item.tax_percentage || 0) : 0,
                inherited_from: 'item',
                source_id: item._id
            };
        }

        // Check subcategory tax if item belongs to subcategory
        if (item.subcategory) {
            const Subcategory = mongoose.model('Subcategory');
            const subcategory = typeof item.subcategory === 'object'
                ? item.subcategory
                : await Subcategory.findById(item.subcategory);

            if (subcategory) {
                // If subcategory has its own tax settings defined, use them
                if (subcategory.tax_applicable !== null && subcategory.tax_applicable !== undefined) {
                    return {
                        tax_applicable: subcategory.tax_applicable,
                        tax_percentage: subcategory.tax_applicable ? (subcategory.tax_percentage || 0) : 0,
                        inherited_from: 'subcategory',
                        source_id: subcategory._id
                    };
                }

                // Otherwise, inherit from subcategory's category
                const Category = mongoose.model('Category');
                const category = typeof subcategory.category === 'object'
                    ? subcategory.category
                    : await Category.findById(subcategory.category);

                if (category) {
                    return {
                        tax_applicable: category.tax_applicable,
                        tax_percentage: category.tax_applicable ? (category.tax_percentage || 0) : 0,
                        inherited_from: 'category',
                        source_id: category._id
                    };
                }
            }
        }

        // Check category tax if item directly belongs to category
        if (item.category) {
            const Category = mongoose.model('Category');
            const category = typeof item.category === 'object'
                ? item.category
                : await Category.findById(item.category);

            if (category) {
                return {
                    tax_applicable: category.tax_applicable,
                    tax_percentage: category.tax_applicable ? (category.tax_percentage || 0) : 0,
                    inherited_from: 'category',
                    source_id: category._id
                };
            }
        }

        // Default: no tax
        return {
            tax_applicable: false,
            tax_percentage: 0,
            inherited_from: 'default',
            source_id: null
        };
    }

    /**
     * Calculate tax amount
     * @param {Number} amount - The amount to calculate tax on
     * @param {Number} taxPercentage - The tax percentage
     * @returns {Object} Tax calculation result
     */
    static calculateTax(amount, taxPercentage) {
        const taxAmount = (amount * taxPercentage) / 100;

        return {
            original_amount: amount,
            tax_percentage: taxPercentage,
            tax_amount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
            total_with_tax: Math.round((amount + taxAmount) * 100) / 100
        };
    }

    /**
     * Get effective tax for a subcategory with inheritance
     * @param {Object} subcategory - The subcategory document
     * @returns {Object} Tax configuration with source information
     */
    static async getSubcategoryTax(subcategory) {
        // If subcategory has its own tax settings defined, use them
        if (subcategory.tax_applicable !== null && subcategory.tax_applicable !== undefined) {
            return {
                tax_applicable: subcategory.tax_applicable,
                tax_percentage: subcategory.tax_applicable ? (subcategory.tax_percentage || 0) : 0,
                inherited_from: 'subcategory',
                source_id: subcategory._id
            };
        }

        // Inherit from category
        const Category = mongoose.model('Category');
        const category = typeof subcategory.category === 'object'
            ? subcategory.category
            : await Category.findById(subcategory.category);

        if (category) {
            return {
                tax_applicable: category.tax_applicable,
                tax_percentage: category.tax_applicable ? (category.tax_percentage || 0) : 0,
                inherited_from: 'category',
                source_id: category._id
            };
        }

        // Default: no tax
        return {
            tax_applicable: false,
            tax_percentage: 0,
            inherited_from: 'default',
            source_id: null
        };
    }

    /**
     * Validate tax configuration
     * @param {Boolean} taxApplicable - Whether tax is applicable
     * @param {Number} taxPercentage - The tax percentage
     * @returns {Object} Validation result
     */
    static validateTaxConfig(taxApplicable, taxPercentage) {
        const errors = [];

        if (taxApplicable === true) {
            if (taxPercentage === undefined || taxPercentage === null) {
                errors.push('Tax percentage is required when tax is applicable');
            } else if (taxPercentage < 0 || taxPercentage > 100) {
                errors.push('Tax percentage must be between 0 and 100');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = TaxEngine;
