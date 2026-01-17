const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { BOOKING_STATUS } = require('../config/constants');

/**
 * Selected Add-on Schema for Booking
 */
const selectedAddonSchema = new Schema({
    addon_group: {
        type: Schema.Types.ObjectId,
        ref: 'AddonGroup',
        required: true
    },
    addon_ids: [{
        type: Schema.Types.ObjectId
    }],
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

/**
 * Price Breakdown Schema
 */
const priceBreakdownSchema = new Schema({
    base_price: {
        type: Number,
        required: true,
        min: 0
    },
    pricing_type: {
        type: String,
        required: true
    },
    pricing_rule_applied: {
        type: String
    },
    discount_amount: {
        type: Number,
        default: 0
    },
    addons_total: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        required: true
    },
    tax_percentage: {
        type: Number,
        default: 0
    },
    tax_amount: {
        type: Number,
        default: 0
    },
    final_price: {
        type: Number,
        required: true
    }
}, { _id: false });

/**
 * Booking Schema
 */
const bookingSchema = new Schema({
    item: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
        required: [true, 'Item is required']
    },
    customer_name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    customer_email: {
        type: String,
        required: [true, 'Customer email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    customer_phone: {
        type: String,
        trim: true,
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    booking_date: {
        type: Date,
        required: [true, 'Booking date is required']
    },
    start_time: {
        type: String,  // Format: "HH:mm"
        required: [true, 'Start time is required']
    },
    end_time: {
        type: String,  // Format: "HH:mm"
        required: [true, 'End time is required']
    },
    quantity: {
        type: Number,
        default: 1,
        min: [1, 'Quantity must be at least 1']
    },
    selected_addons: [selectedAddonSchema],
    price_breakdown: priceBreakdownSchema,
    status: {
        type: String,
        enum: Object.values(BOOKING_STATUS),
        default: BOOKING_STATUS.PENDING
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    cancelled_at: {
        type: Date
    },
    cancellation_reason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
bookingSchema.index({ item: 1, booking_date: 1 });
bookingSchema.index({ customer_email: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ booking_date: 1, start_time: 1, end_time: 1 });
bookingSchema.index({ createdAt: 1 });

/**
 * Static method to check for booking conflicts
 * Returns conflicting bookings if any exist
 */
bookingSchema.statics.findConflicts = async function (itemId, bookingDate, startTime, endTime, excludeBookingId = null) {
    const query = {
        item: itemId,
        booking_date: bookingDate,
        status: { $nin: [BOOKING_STATUS.CANCELLED] },
        $or: [
            // New booking starts during existing booking
            {
                start_time: { $lte: startTime },
                end_time: { $gt: startTime }
            },
            // New booking ends during existing booking
            {
                start_time: { $lt: endTime },
                end_time: { $gte: endTime }
            },
            // New booking completely overlaps existing booking
            {
                start_time: { $gte: startTime },
                end_time: { $lte: endTime }
            }
        ]
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    return this.find(query);
};

/**
 * Check if time slot overlaps with another
 */
bookingSchema.statics.isTimeOverlapping = function (start1, end1, start2, end2) {
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    return s1 < e2 && e1 > s2;
};

/**
 * Get bookings for a specific date
 */
bookingSchema.statics.getBookingsForDate = function (itemId, date) {
    return this.find({
        item: itemId,
        booking_date: date,
        status: { $nin: [BOOKING_STATUS.CANCELLED] }
    }).sort({ start_time: 1 });
};

/**
 * Instance method to cancel booking
 */
bookingSchema.methods.cancel = function (reason) {
    this.status = BOOKING_STATUS.CANCELLED;
    this.cancelled_at = new Date();
    this.cancellation_reason = reason;
    return this.save();
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
