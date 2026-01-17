const { Booking, Item, AddonGroup } = require('../models');
const { BOOKING_STATUS } = require('../config/constants');
const ItemService = require('./itemService');

/**
 * Booking Service
 * Contains all business logic for booking operations
 */
class BookingService {
    /**
     * Create a new booking
     */
    async create(data) {
        // Get item and validate it's bookable
        const item = await Item.findById(data.item)
            .populate('addon_groups');

        if (!item) {
            throw {
                status: 404,
                message: 'Item not found'
            };
        }

        if (!item.is_bookable) {
            throw {
                status: 400,
                message: 'This item is not available for booking'
            };
        }

        if (!item.is_active) {
            throw {
                status: 400,
                message: 'This item is not available'
            };
        }

        // Validate time slot is within availability
        const isAvailable = this.checkAvailability(item, data.booking_date, data.start_time, data.end_time);
        if (!isAvailable.available) {
            throw {
                status: 400,
                message: isAvailable.reason
            };
        }

        // Check for booking conflicts
        const conflicts = await Booking.findConflicts(
            data.item,
            new Date(data.booking_date),
            data.start_time,
            data.end_time
        );

        if (conflicts.length > 0) {
            throw {
                status: 409,
                message: 'Time slot conflicts with existing bookings',
                conflicts: conflicts.map(c => ({
                    id: c._id,
                    start_time: c.start_time,
                    end_time: c.end_time,
                    customer_name: c.customer_name
                }))
            };
        }

        // Calculate price with selected addons
        const addonsForPricing = (data.selected_addons || []).map(a => ({
            addon_group: a.addon_group,
            addon_ids: a.addon_ids
        }));

        const priceCalculation = await ItemService.calculatePrice(data.item, {
            quantity: data.quantity || 1,
            datetime: new Date(data.booking_date + 'T' + data.start_time),
            addons: addonsForPricing
        });

        // Prepare selected addons with prices
        const selectedAddonsWithPrices = (data.selected_addons || []).map(addon => {
            const addonDetail = priceCalculation.addons_details.find(
                d => d.group_name === item.addon_groups.find(g => g._id.toString() === addon.addon_group)?.name
            );

            return {
                addon_group: addon.addon_group,
                addon_ids: addon.addon_ids,
                price: addonDetail?.total_price || 0
            };
        });

        // Create booking
        const booking = new Booking({
            ...data,
            selected_addons: selectedAddonsWithPrices,
            price_breakdown: {
                base_price: priceCalculation.pricing_details.base_price,
                pricing_type: priceCalculation.pricing_details.pricing_type,
                pricing_rule_applied: priceCalculation.pricing_details.pricing_rule_applied,
                discount_amount: priceCalculation.pricing_details.discount_amount,
                addons_total: priceCalculation.addons_total,
                subtotal: priceCalculation.subtotal,
                tax_percentage: priceCalculation.tax.percentage,
                tax_amount: priceCalculation.tax.amount,
                final_price: priceCalculation.final_price
            },
            status: BOOKING_STATUS.CONFIRMED
        });

        await booking.save();

        await booking.populate('item', 'name');

        return booking;
    }

    /**
     * Check availability for a time slot
     */
    checkAvailability(item, bookingDate, startTime, endTime) {
        if (!item.availability_slots || item.availability_slots.length === 0) {
            return { available: true };
        }

        const date = new Date(bookingDate);
        const dayOfWeek = date.getDay();

        // Find matching availability slot
        const matchingSlot = item.availability_slots.find(slot => {
            if (slot.day !== dayOfWeek) return false;

            // Check if requested time is within slot
            return this.isTimeWithinSlot(startTime, endTime, slot.start_time, slot.end_time);
        });

        if (!matchingSlot) {
            return {
                available: false,
                reason: 'Requested time slot is not within available hours'
            };
        }

        return { available: true, slot: matchingSlot };
    }

    /**
     * Check if time is within a slot
     */
    isTimeWithinSlot(startTime, endTime, slotStart, slotEnd) {
        const toMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const st = toMinutes(startTime);
        const et = toMinutes(endTime);
        const ss = toMinutes(slotStart);
        const se = toMinutes(slotEnd);

        return st >= ss && et <= se;
    }

    /**
     * Get all bookings with pagination and filtering
     */
    async getAll(query = {}) {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            item,
            customer_email,
            status,
            date_from,
            date_to
        } = query;

        // Build filter
        const filter = {};

        if (item) {
            filter.item = item;
        }

        if (customer_email) {
            filter.customer_email = customer_email.toLowerCase();
        }

        if (status) {
            filter.status = status.toUpperCase();
        }

        if (date_from || date_to) {
            filter.booking_date = {};
            if (date_from) {
                filter.booking_date.$gte = new Date(date_from);
            }
            if (date_to) {
                filter.booking_date.$lte = new Date(date_to);
            }
        }

        // Build sort
        const sortObj = {};
        const sortFields = sort.split(',');
        sortFields.forEach(field => {
            if (field.startsWith('-')) {
                sortObj[field.substring(1)] = -1;
            } else {
                sortObj[field] = 1;
            }
        });

        // Execute query
        const skip = (page - 1) * limit;

        const [bookings, total] = await Promise.all([
            Booking.find(filter)
                .populate('item', 'name')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit)),
            Booking.countDocuments(filter)
        ]);

        return {
            bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get booking by ID
     */
    async getById(id) {
        const booking = await Booking.findById(id)
            .populate('item', 'name description')
            .populate('selected_addons.addon_group', 'name');

        if (!booking) {
            throw {
                status: 404,
                message: 'Booking not found'
            };
        }

        return booking;
    }

    /**
     * Get bookings for a specific item and date
     */
    async getBookingsForDate(itemId, date) {
        const bookings = await Booking.getBookingsForDate(itemId, new Date(date));

        return bookings;
    }

    /**
     * Get available slots for an item on a specific date
     */
    async getAvailableSlots(itemId, date) {
        const item = await Item.findById(itemId);

        if (!item) {
            throw {
                status: 404,
                message: 'Item not found'
            };
        }

        if (!item.is_bookable) {
            throw {
                status: 400,
                message: 'This item is not available for booking'
            };
        }

        const bookingDate = new Date(date);
        const dayOfWeek = bookingDate.getDay();

        // Get availability slots for this day
        const daySlots = item.availability_slots.filter(
            slot => slot.day === dayOfWeek
        );

        if (daySlots.length === 0) {
            return {
                available: false,
                message: 'No availability on this day',
                slots: []
            };
        }

        // Get existing bookings for this date
        const existingBookings = await Booking.getBookingsForDate(itemId, bookingDate);

        // Calculate available time slots
        const availableSlots = [];

        for (const slot of daySlots) {
            const slotBookings = existingBookings.filter(booking =>
                Booking.isTimeOverlapping(
                    booking.start_time,
                    booking.end_time,
                    slot.start_time,
                    slot.end_time
                )
            );

            availableSlots.push({
                start_time: slot.start_time,
                end_time: slot.end_time,
                max_bookings: slot.max_bookings,
                current_bookings: slotBookings.length,
                is_available: slotBookings.length < slot.max_bookings
            });
        }

        return {
            item_id: itemId,
            date: date,
            day_of_week: dayOfWeek,
            slots: availableSlots
        };
    }

    /**
     * Update booking
     */
    async update(id, data) {
        const booking = await Booking.findById(id);

        if (!booking) {
            throw {
                status: 404,
                message: 'Booking not found'
            };
        }

        // Don't allow updates to cancelled or completed bookings
        if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(booking.status)) {
            throw {
                status: 400,
                message: `Cannot update ${booking.status.toLowerCase()} booking`
            };
        }

        // If time is being changed, check for conflicts
        if (data.start_time || data.end_time || data.booking_date) {
            const newStartTime = data.start_time || booking.start_time;
            const newEndTime = data.end_time || booking.end_time;
            const newDate = data.booking_date ? new Date(data.booking_date) : booking.booking_date;

            const conflicts = await Booking.findConflicts(
                booking.item,
                newDate,
                newStartTime,
                newEndTime,
                booking._id
            );

            if (conflicts.length > 0) {
                throw {
                    status: 409,
                    message: 'New time slot conflicts with existing bookings',
                    conflicts: conflicts.map(c => ({
                        id: c._id,
                        start_time: c.start_time,
                        end_time: c.end_time
                    }))
                };
            }
        }

        // Recalculate price if quantity or addons changed
        if (data.quantity || data.selected_addons) {
            const item = await Item.findById(booking.item).populate('addon_groups');

            const addonsForPricing = (data.selected_addons || booking.selected_addons).map(a => ({
                addon_group: a.addon_group.toString(),
                addon_ids: a.addon_ids.map(id => id.toString())
            }));

            const priceCalculation = await ItemService.calculatePrice(booking.item, {
                quantity: data.quantity || booking.quantity,
                datetime: new Date(
                    (data.booking_date || booking.booking_date) + 'T' +
                    (data.start_time || booking.start_time)
                ),
                addons: addonsForPricing
            });

            data.price_breakdown = {
                base_price: priceCalculation.pricing_details.base_price,
                pricing_type: priceCalculation.pricing_details.pricing_type,
                pricing_rule_applied: priceCalculation.pricing_details.pricing_rule_applied,
                discount_amount: priceCalculation.pricing_details.discount_amount,
                addons_total: priceCalculation.addons_total,
                subtotal: priceCalculation.subtotal,
                tax_percentage: priceCalculation.tax.percentage,
                tax_amount: priceCalculation.tax.amount,
                final_price: priceCalculation.final_price
            };
        }

        Object.assign(booking, data);
        await booking.save();

        await booking.populate('item', 'name');

        return booking;
    }

    /**
     * Cancel booking
     */
    async cancel(id, reason = '') {
        const booking = await Booking.findById(id);

        if (!booking) {
            throw {
                status: 404,
                message: 'Booking not found'
            };
        }

        if (booking.status === BOOKING_STATUS.CANCELLED) {
            throw {
                status: 400,
                message: 'Booking is already cancelled'
            };
        }

        if (booking.status === BOOKING_STATUS.COMPLETED) {
            throw {
                status: 400,
                message: 'Cannot cancel a completed booking'
            };
        }

        await booking.cancel(reason);

        return booking;
    }

    /**
     * Complete booking
     */
    async complete(id) {
        const booking = await Booking.findById(id);

        if (!booking) {
            throw {
                status: 404,
                message: 'Booking not found'
            };
        }

        if (booking.status === BOOKING_STATUS.CANCELLED) {
            throw {
                status: 400,
                message: 'Cannot complete a cancelled booking'
            };
        }

        booking.status = BOOKING_STATUS.COMPLETED;
        await booking.save();

        return booking;
    }

    /**
     * Get customer booking history
     */
    async getCustomerHistory(email) {
        const bookings = await Booking.find({
            customer_email: email.toLowerCase()
        })
            .populate('item', 'name')
            .sort({ booking_date: -1, start_time: -1 });

        return bookings;
    }

    /**
     * Get upcoming bookings for an item
     */
    async getUpcomingBookings(itemId, days = 7) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const bookings = await Booking.find({
            item: itemId,
            booking_date: { $gte: startDate, $lte: endDate },
            status: { $nin: [BOOKING_STATUS.CANCELLED] }
        })
            .sort({ booking_date: 1, start_time: 1 });

        return bookings;
    }
}

module.exports = new BookingService();
