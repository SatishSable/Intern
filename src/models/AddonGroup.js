const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ADDON_TYPES, ADDON_GROUP_SELECTION } = require('../config/constants');

/**
 * Add-on Schema
 * Individual add-on option
 */
const addonSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Add-on name is required'],
        trim: true,
        maxlength: [100, 'Add-on name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

/**
 * Add-on Group Schema
 * Groups add-ons together (e.g., "Choose your sauce", "Extra toppings")
 */
const addonGroupSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Add-on group name is required'],
        trim: true,
        maxlength: [100, 'Add-on group name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(ADDON_TYPES),
        default: ADDON_TYPES.OPTIONAL
    },
    selection_type: {
        type: String,
        required: true,
        enum: Object.values(ADDON_GROUP_SELECTION),
        default: ADDON_GROUP_SELECTION.SINGLE
    },
    min_selections: {
        type: Number,
        default: 0,
        min: 0
    },
    max_selections: {
        type: Number,
        default: 1,
        min: 1
    },
    addons: [addonSchema],
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

// Indexes
addonGroupSchema.index({ name: 1 });
addonGroupSchema.index({ is_active: 1 });
addonGroupSchema.index({ type: 1 });

// Validation for selection constraints
addonGroupSchema.pre('validate', function (next) {
    if (this.type === ADDON_TYPES.MANDATORY && this.min_selections === 0) {
        this.min_selections = 1;
    }

    if (this.selection_type === ADDON_GROUP_SELECTION.SINGLE) {
        this.max_selections = 1;
    }

    if (this.min_selections > this.max_selections) {
        next(new Error('min_selections cannot be greater than max_selections'));
    } else {
        next();
    }
});

/**
 * Calculate total price for selected add-ons
 */
addonGroupSchema.methods.calculateSelectedPrice = function (selectedAddonIds) {
    let total = 0;

    for (const addon of this.addons) {
        if (selectedAddonIds.includes(addon._id.toString()) && addon.is_active) {
            total += addon.price;
        }
    }

    return total;
};

/**
 * Validate selections against group rules
 */
addonGroupSchema.methods.validateSelections = function (selectedAddonIds) {
    const activeAddons = this.addons.filter(a => a.is_active);
    const validSelections = selectedAddonIds.filter(id =>
        activeAddons.some(a => a._id.toString() === id)
    );

    if (validSelections.length < this.min_selections) {
        return {
            valid: false,
            error: `Minimum ${this.min_selections} selection(s) required for ${this.name}`
        };
    }

    if (validSelections.length > this.max_selections) {
        return {
            valid: false,
            error: `Maximum ${this.max_selections} selection(s) allowed for ${this.name}`
        };
    }

    return { valid: true };
};

// Static method to find active groups
addonGroupSchema.statics.findActive = function () {
    return this.find({ is_active: true });
};

const AddonGroup = mongoose.model('AddonGroup', addonGroupSchema);

module.exports = AddonGroup;
