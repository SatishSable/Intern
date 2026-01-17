require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/database');
const routes = require('./routes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `Duplicate value for ${field}`
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start listening
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🍽️  Guestara Menu & Services Management Backend               ║
║                                                                ║
║   Server running on: http://localhost:${PORT}                     ║
║   API Base URL: http://localhost:${PORT}/api/v1                   ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(43)}║
║                                                                ║
║   📚 API Endpoints:                                            ║
║   • Categories:    /api/v1/categories                          ║
║   • Subcategories: /api/v1/subcategories                       ║
║   • Items:         /api/v1/items                               ║
║   • Add-ons:       /api/v1/addon-groups                        ║
║   • Bookings:      /api/v1/bookings                            ║
║                                                                ║
║   🔥 Price Calculation API:                                    ║
║   GET /api/v1/items/:id/price                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
