const express = require('express');
const router = express.Router();

const categoryRoutes = require('./categoryRoutes');
const subcategoryRoutes = require('./subcategoryRoutes');
const itemRoutes = require('./itemRoutes');
const addonRoutes = require('./addonRoutes');
const bookingRoutes = require('./bookingRoutes');

// Mount routes
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/items', itemRoutes);
router.use('/addon-groups', addonRoutes);
router.use('/bookings', bookingRoutes);

// API Info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Guestara Menu & Services Management API',
        version: 'v1',
        endpoints: {
            categories: '/api/v1/categories',
            subcategories: '/api/v1/subcategories',
            items: '/api/v1/items',
            'addon-groups': '/api/v1/addon-groups',
            bookings: '/api/v1/bookings'
        },
        features: [
            'Category, Subcategory & Item Management',
            'Tax Inheritance Engine (Item → Subcategory → Category)',
            'Soft Deletes (is_active based)',
            'Advanced Pricing Engine (STATIC, TIERED, COMPLIMENTARY, DISCOUNTED, DYNAMIC)',
            'Availability & Booking System with Conflict Prevention',
            'Add-ons with Pricing Impact',
            'Search, Filter, Pagination & Sorting'
        ],
        pricing_api: {
            endpoint: 'GET /api/v1/items/:id/price',
            description: 'Calculate dynamic price including tax, discounts, and add-ons',
            query_params: {
                quantity: 'Number of items (default: 1)',
                datetime: 'ISO datetime for dynamic pricing (default: now)',
                addons: 'JSON array of selected add-ons'
            }
        }
    });
});

module.exports = router;
