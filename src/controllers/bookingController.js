const bookingService = require('../services/bookingService');
const {
    createBookingSchema,
    updateBookingSchema,
    bookingIdSchema,
    cancelBookingSchema,
    bookingQuerySchema,
    checkAvailabilitySchema
} = require('../validations');
const {
    successResponse,
    errorResponse,
    paginatedResponse,
    validationErrorResponse,
    notFoundResponse
} = require('../utils/apiResponse');

/**
 * Booking Controller
 * Handles HTTP requests for booking operations
 */
class BookingController {
    /**
     * Create a new booking
     * POST /bookings
     */
    async create(req, res) {
        try {
            const { error, value } = createBookingSchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const booking = await bookingService.create(value);

            return successResponse(res, booking, 'Booking created successfully', 201);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status, err.conflicts);
            }
            console.error('Create booking error:', err);
            return errorResponse(res, 'Failed to create booking');
        }
    }

    /**
     * Get all bookings
     * GET /bookings
     */
    async getAll(req, res) {
        try {
            const result = await bookingService.getAll(req.query);

            return paginatedResponse(
                res,
                result.bookings,
                result.pagination,
                'Bookings retrieved successfully'
            );
        } catch (err) {
            console.error('Get bookings error:', err);
            return errorResponse(res, 'Failed to retrieve bookings');
        }
    }

    /**
     * Get booking by ID
     * GET /bookings/:id
     */
    async getById(req, res) {
        try {
            const { error } = bookingIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const booking = await bookingService.getById(req.params.id);

            return successResponse(res, booking, 'Booking retrieved successfully');
        } catch (err) {
            if (err.status === 404) {
                return notFoundResponse(res, 'Booking');
            }
            console.error('Get booking error:', err);
            return errorResponse(res, 'Failed to retrieve booking');
        }
    }

    /**
     * Get available slots for an item on a specific date
     * GET /bookings/availability
     */
    async getAvailableSlots(req, res) {
        try {
            const { error, value } = checkAvailabilitySchema.validate(req.query);
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await bookingService.getAvailableSlots(value.item, value.date);

            return successResponse(res, result, 'Available slots retrieved successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Get available slots error:', err);
            return errorResponse(res, 'Failed to retrieve available slots');
        }
    }

    /**
     * Get bookings for a specific item and date
     * GET /bookings/by-date
     */
    async getBookingsForDate(req, res) {
        try {
            const { item, date } = req.query;

            if (!item || !date) {
                return validationErrorResponse(res, 'item and date are required');
            }

            const bookings = await bookingService.getBookingsForDate(item, date);

            return successResponse(res, bookings, 'Bookings retrieved successfully');
        } catch (err) {
            console.error('Get bookings for date error:', err);
            return errorResponse(res, 'Failed to retrieve bookings');
        }
    }

    /**
     * Update booking
     * PUT /bookings/:id
     */
    async update(req, res) {
        try {
            const { error: idError } = bookingIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            const { error, value } = updateBookingSchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const booking = await bookingService.update(req.params.id, value);

            return successResponse(res, booking, 'Booking updated successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status, err.conflicts);
            }
            console.error('Update booking error:', err);
            return errorResponse(res, 'Failed to update booking');
        }
    }

    /**
     * Cancel booking
     * POST /bookings/:id/cancel
     */
    async cancel(req, res) {
        try {
            const { error: idError } = bookingIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            const { error, value } = cancelBookingSchema.validate(req.body);
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const booking = await bookingService.cancel(req.params.id, value.reason);

            return successResponse(res, booking, 'Booking cancelled successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Cancel booking error:', err);
            return errorResponse(res, 'Failed to cancel booking');
        }
    }

    /**
     * Complete booking
     * POST /bookings/:id/complete
     */
    async complete(req, res) {
        try {
            const { error } = bookingIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const booking = await bookingService.complete(req.params.id);

            return successResponse(res, booking, 'Booking completed successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Complete booking error:', err);
            return errorResponse(res, 'Failed to complete booking');
        }
    }

    /**
     * Get customer booking history
     * GET /bookings/customer/:email
     */
    async getCustomerHistory(req, res) {
        try {
            const { email } = req.params;

            if (!email) {
                return validationErrorResponse(res, 'Email is required');
            }

            const bookings = await bookingService.getCustomerHistory(email);

            return successResponse(res, bookings, 'Customer booking history retrieved successfully');
        } catch (err) {
            console.error('Get customer history error:', err);
            return errorResponse(res, 'Failed to retrieve customer history');
        }
    }

    /**
     * Get upcoming bookings for an item
     * GET /bookings/upcoming/:itemId
     */
    async getUpcomingBookings(req, res) {
        try {
            const { itemId } = req.params;
            const { days = 7 } = req.query;

            const bookings = await bookingService.getUpcomingBookings(itemId, parseInt(days));

            return successResponse(res, bookings, 'Upcoming bookings retrieved successfully');
        } catch (err) {
            console.error('Get upcoming bookings error:', err);
            return errorResponse(res, 'Failed to retrieve upcoming bookings');
        }
    }
}

module.exports = new BookingController();
