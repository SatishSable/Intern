const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Category Schema
 * Top-level entity for organizing menu items
 */
const categorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [100, 'Category name cannot exceed 100 characters']
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
    tax_applicable: {
        type: Boolean,
        default: false
    },
    tax_percentage: {
        type: Number,
        min: [0, 'Tax percentage cannot be negative'],
        max: [100, 'Tax percentage cannot exceed 100'],
        validate: {
            validator: function (value) {
                // If tax_applicable is true, tax_percentage is required
                if (this.tax_applicable && (value === null || value === undefined)) {
                    return false;
                }
                return true;
            },
            message: 'Tax percentage is required when tax is applicable'
        }
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

// Compound index for unique name (can be made per restaurant if needed)
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ is_active: 1 });
categorySchema.index({ display_order: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Subcategory',
    localField: '_id',
    foreignField: 'category'
});

// Virtual to get item count
categorySchema.virtual('itemCount', {
    ref: 'Item',
    localField: '_id',
    foreignField: 'category',
    count: true
});

// Pre-save middleware to handle tax_percentage
categorySchema.pre('save', function (next) {
    if (!this.tax_applicable) {
        this.tax_percentage = undefined;
    }
    next();
});

// Static method to find active categories
categorySchema.statics.findActive = function () {
    return this.find({ is_active: true });
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
