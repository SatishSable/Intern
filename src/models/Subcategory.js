const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Subcategory Schema
 * Belongs to a Category, can override tax settings
 */
const subcategorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Subcategory name is required'],
        trim: true,
        maxlength: [100, 'Subcategory name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    image: {
        type: String,
        trim: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    // Tax inheritance: if not defined, inherits from category
    tax_applicable: {
        type: Boolean,
        default: null  // null means inherit from category
    },
    tax_percentage: {
        type: Number,
        min: [0, 'Tax percentage cannot be negative'],
        max: [100, 'Tax percentage cannot exceed 100'],
        default: null  // null means inherit from category
    },
    is_active: {
        type: Boolean,
        default: true
    },
    display_order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound index for unique name within a category
subcategorySchema.index({ name: 1, category: 1 }, { unique: true });
subcategorySchema.index({ category: 1 });
subcategorySchema.index({ is_active: 1 });
subcategorySchema.index({ display_order: 1 });

// Virtual for items
subcategorySchema.virtual('items', {
    ref: 'Item',
    localField: '_id',
    foreignField: 'subcategory'
});

// Virtual to get item count
subcategorySchema.virtual('itemCount', {
    ref: 'Item',
    localField: '_id',
    foreignField: 'subcategory',
    count: true
});

/**
 * Method to get effective tax settings (with inheritance)
 * This implements the tax inheritance chain: Subcategory Tax → Category Tax
 */
subcategorySchema.methods.getEffectiveTax = async function () {
    // If subcategory has its own tax settings, use them
    if (this.tax_applicable !== null) {
        return {
            tax_applicable: this.tax_applicable,
            tax_percentage: this.tax_applicable ? (this.tax_percentage || 0) : 0,
            inherited_from: 'subcategory'
        };
    }

    // Otherwise, inherit from category
    const category = await mongoose.model('Category').findById(this.category);
    if (category) {
        return {
            tax_applicable: category.tax_applicable,
            tax_percentage: category.tax_applicable ? (category.tax_percentage || 0) : 0,
            inherited_from: 'category'
        };
    }

    // Default: no tax
    return {
        tax_applicable: false,
        tax_percentage: 0,
        inherited_from: 'default'
    };
};

// Static method to find active subcategories
subcategorySchema.statics.findActive = function () {
    return this.find({ is_active: true });
};

// Static method to find by category
subcategorySchema.statics.findByCategory = function (categoryId) {
    return this.find({ category: categoryId, is_active: true });
};

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

module.exports = Subcategory;
