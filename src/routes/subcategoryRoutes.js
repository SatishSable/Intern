const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategoryController');

/**
 * Subcategory Routes
 * Base path: /api/v1/subcategories
 */

// Create subcategory
router.post('/', (req, res) => subcategoryController.create(req, res));

// Get all subcategories
router.get('/', (req, res) => subcategoryController.getAll(req, res));

// Get subcategory by ID
router.get('/:id', (req, res) => subcategoryController.getById(req, res));

// Get subcategory with effective tax
router.get('/:id/tax', (req, res) => subcategoryController.getWithTax(req, res));

// Get subcategory with items
router.get('/:id/items', (req, res) => subcategoryController.getWithItems(req, res));

// Update subcategory
router.put('/:id', (req, res) => subcategoryController.update(req, res));

// Soft delete subcategory
router.delete('/:id', (req, res) => subcategoryController.delete(req, res));

// Hard delete subcategory (permanent)
router.delete('/:id/permanent', (req, res) => subcategoryController.hardDelete(req, res));

// Restore soft-deleted subcategory
router.post('/:id/restore', (req, res) => subcategoryController.restore(req, res));

module.exports = router;
