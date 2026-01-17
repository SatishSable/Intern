const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

/**
 * Booking Routes
 * Base path: /api/v1/bookings
 */

// Get available slots (must be before /:id route)
router.get('/availability', (req, res) => bookingController.getAvailableSlots(req, res));

// Get bookings for a specific date (must be before /:id route)
router.get('/by-date', (req, res) => bookingController.getBookingsForDate(req, res));

// Get customer booking history
router.get('/customer/:email', (req, res) => bookingController.getCustomerHistory(req, res));

// Get upcoming bookings for an item
router.get('/upcoming/:itemId', (req, res) => bookingController.getUpcomingBookings(req, res));

// Create booking
router.post('/', (req, res) => bookingController.create(req, res));

// Get all bookings
router.get('/', (req, res) => bookingController.getAll(req, res));

// Get booking by ID
router.get('/:id', (req, res) => bookingController.getById(req, res));

// Update booking
router.put('/:id', (req, res) => bookingController.update(req, res));

// Cancel booking
router.post('/:id/cancel', (req, res) => bookingController.cancel(req, res));

// Complete booking
router.post('/:id/complete', (req, res) => bookingController.complete(req, res));

module.exports = router;
