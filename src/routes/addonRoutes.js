const express = require('express');
const router = express.Router();
const addonController = require('../controllers/addonController');

/**
 * Add-on Group Routes
 * Base path: /api/v1/addon-groups
 */

// Create add-on group
router.post('/', (req, res) => addonController.create(req, res));

// Get all add-on groups
router.get('/', (req, res) => addonController.getAll(req, res));

// Get add-on group by ID
router.get('/:id', (req, res) => addonController.getById(req, res));

// Update add-on group
router.put('/:id', (req, res) => addonController.update(req, res));

// Soft delete add-on group
router.delete('/:id', (req, res) => addonController.delete(req, res));

// Hard delete add-on group (permanent)
router.delete('/:id/permanent', (req, res) => addonController.hardDelete(req, res));

// Restore soft-deleted add-on group
router.post('/:id/restore', (req, res) => addonController.restore(req, res));

// Add a single add-on to a group
router.post('/:id/addons', (req, res) => addonController.addAddon(req, res));

// Update a single add-on within a group
router.put('/:id/addons/:addonId', (req, res) => addonController.updateAddon(req, res));

// Remove a single add-on from a group
router.delete('/:id/addons/:addonId', (req, res) => addonController.removeAddon(req, res));

// Calculate price for selected add-ons
router.post('/:id/calculate-price', (req, res) => addonController.calculatePrice(req, res));

module.exports = router;
