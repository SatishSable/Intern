const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

/**
 * Item Routes
 * Base path: /api/v1/items
 */

// Search items (must be before /:id route)
router.get('/search', (req, res) => itemController.search(req, res));

// Create item
router.post('/', (req, res) => itemController.create(req, res));

// Get all items
router.get('/', (req, res) => itemController.getAll(req, res));

// Get item by ID
router.get('/:id', (req, res) => itemController.getById(req, res));

// Get item with effective tax
router.get('/:id/tax', (req, res) => itemController.getWithTax(req, res));

// 🔥 Price Calculation API - GET /items/:id/price
router.get('/:id/price', (req, res) => itemController.calculatePrice(req, res));

// 🔥 Price Calculation API with body (for complex addon selections)
router.post('/:id/price', (req, res) => itemController.calculatePrice(req, res));

// Update item
router.put('/:id', (req, res) => itemController.update(req, res));

// Soft delete item
router.delete('/:id', (req, res) => itemController.delete(req, res));

// Hard delete item (permanent)
router.delete('/:id/permanent', (req, res) => itemController.hardDelete(req, res));

// Restore soft-deleted item
router.post('/:id/restore', (req, res) => itemController.restore(req, res));

module.exports = router;
