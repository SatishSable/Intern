const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { PRICING_TYPES, DISCOUNT_TYPES, DAYS_OF_WEEK } = require('../config/constants');

/**
 * Tier Schema (for TIERED pricing)
 */
const tierSchema = new Schema({
    min_quantity: {
        type: Number,
        required: true,
        min: 0
    },
    max_quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

/**
 * Dynamic Pricing Rule Schema (for DYNAMIC pricing)
 */
const dynamicPricingRuleSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    days: [{
        type: Number,
        enum: Object.values(DAYS_OF_WEEK)
    }],
    start_time: {
        type: String,  // Format: "HH:mm"
        required: true
    },
    end_time: {
        type: String,  // Format: "HH:mm"
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    priority: {
        type: Number,
        default: 0  // Higher priority rules are applied first
    }
}, { _id: true });

/**
 * Availability Slot Schema
 */
const availabilitySlotSchema = new Schema({
    day: {
        type: Number,
        required: true,
        enum: Object.values(DAYS_OF_WEEK)
    },
    start_time: {
        type: String,  // Format: "HH:mm"
        required: true
    },
    end_time: {
        type: String,  // Format: "HH:mm"
        required: true
    },
    max_bookings: {
        type: Number,
        default: 1,
        min: 1
    }
}, { _id: true });

/**
 * Pricing Configuration Schema
 */
const pricingConfigSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: Object.values(PRICING_TYPES)
    },
    // For STATIC pricing
    base_price: {
        type: Number,
        min: 0
    },
    // For TIERED pricing
    tiers: [tierSchema],
    // For DISCOUNTED pricing
    discount: {
        type: {
            type: String,
            enum: Object.values(DISCOUNT_TYPES)
        },
        value: {
            type: Number,
            min: 0
        }
    },
    // For DYNAMIC pricing
    dynamic_rules: [dynamicPricingRuleSchema],
    default_price: {
        type: Number,
        min: 0
    }
}, { _id: false });

/**
 * Item Schema
 * Can belong to either Category OR Subcategory
 */
const itemSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        maxlength: [200, 'Item name cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    image: {
        type: String,
        trim: true
    },
    // Belongs to EITHER category OR subcategory (not both required)
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    subcategory: {
        type: Schema.Types.ObjectId,
        ref: 'Subcategory'
    },
    // Tax settings (inherits if not set)
    tax_applicable: {
        type: Boolean,
        default: null  // null means inherit
    },
    tax_percentage: {
        type: Number,
        min: [0, 'Tax percentage cannot be negative'],
        max: [100, 'Tax percentage cannot exceed 100'],
        default: null  // null means inherit
    },
    // Pricing configuration
    pricing: {
        type: pricingConfigSchema,
        required: true
    },
    // Availability & Booking
    is_bookable: {
        type: Boolean,
        default: false
    },
    availability_slots: [availabilitySlotSchema],
    booking_duration_minutes: {
        type: Number,
        min: 1,
        default: 60
    },
    // Add-ons reference
    addon_groups: [{
        type: Schema.Types.ObjectId,
        ref: 'AddonGroup'
    }],
    is_active: {
        type: Boolean,
        default: true
    },
    display_order: {
        type: Number,
        default: 0
    },
    // Additional metadata
    tags: [{
        type: String,
        trim: true
    }],
    attributes: {
        type: Map,
        of: Schema.Types.Mixed
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
itemSchema.index({ name: 'text', description: 'text', tags: 'text' });
itemSchema.index({ category: 1 });
itemSchema.index({ subcategory: 1 });
itemSchema.index({ is_active: 1 });
itemSchema.index({ 'pricing.type': 1 });
itemSchema.index({ 'pricing.base_price': 1 });
itemSchema.index({ display_order: 1 });
itemSchema.index({ createdAt: 1 });

// Validation: Must belong to at least category or subcategory
itemSchema.pre('validate', function (next) {
    if (!this.category && !this.subcategory) {
        next(new Error('Item must belong to either a category or subcategory'));
    } else {
        next();
    }
});

/**
 * Method to get effective tax settings (with inheritance chain)
 * Item Tax → Subcategory Tax → Category Tax
 */
itemSchema.methods.getEffectiveTax = async function () {
    // If item has its own tax settings, use them
    if (this.tax_applicable !== null) {
        return {
            tax_applicable: this.tax_applicable,
            tax_percentage: this.tax_applicable ? (this.tax_percentage || 0) : 0,
            inherited_from: 'item'
        };
    }

    // If item belongs to subcategory, check subcategory tax
    if (this.subcategory) {
        const Subcategory = mongoose.model('Subcategory');
        const subcategory = await Subcategory.findById(this.subcategory);
        if (subcategory) {
            const subcategoryTax = await subcategory.getEffectiveTax();
            return subcategoryTax;
        }
    }

    // Otherwise, inherit from category
    if (this.category) {
        const Category = mongoose.model('Category');
        const category = await Category.findById(this.category);
        if (category) {
            return {
                tax_applicable: category.tax_applicable,
                tax_percentage: category.tax_applicable ? (category.tax_percentage || 0) : 0,
                inherited_from: 'category'
            };
        }
    }

    // Default: no tax
    return {
        tax_applicable: false,
        tax_percentage: 0,
        inherited_from: 'default'
    };
};

// Static method to find active items
itemSchema.statics.findActive = function () {
    return this.find({ is_active: true });
};

// Virtual for bookings
itemSchema.virtual('bookings', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'item'
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
