const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

/**
 * Category Routes
 * Base path: /api/v1/categories
 */

// Create category
router.post('/', (req, res) => categoryController.create(req, res));

// Get all categories
router.get('/', (req, res) => categoryController.getAll(req, res));

// Get category by ID
router.get('/:id', (req, res) => categoryController.getById(req, res));

// Get category with subcategories
router.get('/:id/subcategories', (req, res) => categoryController.getWithSubcategories(req, res));

// Update category
router.put('/:id', (req, res) => categoryController.update(req, res));

// Soft delete category
router.delete('/:id', (req, res) => categoryController.delete(req, res));

// Hard delete category (permanent)
router.delete('/:id/permanent', (req, res) => categoryController.hardDelete(req, res));

// Restore soft-deleted category
router.post('/:id/restore', (req, res) => categoryController.restore(req, res));

module.exports = router;
