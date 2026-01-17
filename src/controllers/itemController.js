const itemService = require('../services/itemService');
const {
    createItemSchema,
    updateItemSchema,
    itemIdSchema,
    priceQuerySchema
} = require('../validations');
const {
    successResponse,
    errorResponse,
    paginatedResponse,
    validationErrorResponse,
    notFoundResponse
} = require('../utils/apiResponse');

/**
 * Item Controller
 * Handles HTTP requests for item operations
 */
class ItemController {
    /**
     * Create a new item
     * POST /items
     */
    async create(req, res) {
        try {
            const { error, value } = createItemSchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const item = await itemService.create(value);

            return successResponse(res, item, 'Item created successfully', 201);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status, err.errors);
            }
            console.error('Create item error:', err);
            return errorResponse(res, 'Failed to create item');
        }
    }

    /**
     * Get all items
     * GET /items
     */
    async getAll(req, res) {
        try {
            const result = await itemService.getAll(req.query);

            return paginatedResponse(
                res,
                result.items,
                result.pagination,
                'Items retrieved successfully'
            );
        } catch (err) {
            console.error('Get items error:', err);
            return errorResponse(res, 'Failed to retrieve items');
        }
    }

    /**
     * Get item by ID
     * GET /items/:id
     */
    async getById(req, res) {
        try {
            const { error } = itemIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const item = await itemService.getById(req.params.id);

            return successResponse(res, item, 'Item retrieved successfully');
        } catch (err) {
            if (err.status === 404) {
                return notFoundResponse(res, 'Item');
            }
            console.error('Get item error:', err);
            return errorResponse(res, 'Failed to retrieve item');
        }
    }

    /**
     * Get item with effective tax
     * GET /items/:id/tax
     */
    async getWithTax(req, res) {
        try {
            const { error } = itemIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await itemService.getWithTax(req.params.id);

            return successResponse(res, result, 'Item with tax info retrieved successfully');
        } catch (err) {
            if (err.status === 404) {
                return notFoundResponse(res, 'Item');
            }
            console.error('Get item with tax error:', err);
            return errorResponse(res, 'Failed to retrieve item');
        }
    }

    /**
     * Calculate item price dynamically
     * GET /items/:id/price
     * 🔥 This is the main Price Calculation API
     */
    async calculatePrice(req, res) {
        try {
            const { error: idError } = itemIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            // Parse query parameters
            const options = {
                quantity: parseInt(req.query.quantity) || 1,
                datetime: req.query.datetime ? new Date(req.query.datetime) : new Date()
            };

            // Parse addons from query or body
            if (req.body.addons) {
                options.addons = req.body.addons;
            } else if (req.query.addons) {
                try {
                    options.addons = JSON.parse(req.query.addons);
                } catch (e) {
                    options.addons = [];
                }
            }

            const priceResult = await itemService.calculatePrice(req.params.id, options);

            return successResponse(res, priceResult, 'Price calculated successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Calculate price error:', err);
            return errorResponse(res, 'Failed to calculate price');
        }
    }

    /**
     * Update item
     * PUT /items/:id
     */
    async update(req, res) {
        try {
            const { error: idError } = itemIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            const { error, value } = updateItemSchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const item = await itemService.update(req.params.id, value);

            return successResponse(res, item, 'Item updated successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status, err.errors);
            }
            console.error('Update item error:', err);
            return errorResponse(res, 'Failed to update item');
        }
    }

    /**
     * Soft delete item
     * DELETE /items/:id
     */
    async delete(req, res) {
        try {
            const { error } = itemIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await itemService.delete(req.params.id);

            return successResponse(res, result, result.message);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Delete item error:', err);
            return errorResponse(res, 'Failed to delete item');
        }
    }

    /**
     * Hard delete item
     * DELETE /items/:id/permanent
     */
    async hardDelete(req, res) {
        try {
            const { error } = itemIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await itemService.hardDelete(req.params.id);

            return successResponse(res, result, result.message);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Hard delete item error:', err);
            return errorResponse(res, 'Failed to delete item');
        }
    }

    /**
     * Restore soft-deleted item
     * POST /items/:id/restore
     */
    async restore(req, res) {
        try {
            const { error } = itemIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const item = await itemService.restore(req.params.id);

            return successResponse(res, item, 'Item restored successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Restore item error:', err);
            return errorResponse(res, 'Failed to restore item');
        }
    }

    /**
     * Get items by category
     * GET /categories/:categoryId/items
     */
    async getByCategory(req, res) {
        try {
            const items = await itemService.getByCategory(req.params.categoryId, req.query);

            return successResponse(res, items, 'Items retrieved successfully');
        } catch (err) {
            console.error('Get items by category error:', err);
            return errorResponse(res, 'Failed to retrieve items');
        }
    }

    /**
     * Get items by subcategory
     * GET /subcategories/:subcategoryId/items
     */
    async getBySubcategory(req, res) {
        try {
            const items = await itemService.getBySubcategory(req.params.subcategoryId, req.query);

            return successResponse(res, items, 'Items retrieved successfully');
        } catch (err) {
            console.error('Get items by subcategory error:', err);
            return errorResponse(res, 'Failed to retrieve items');
        }
    }

    /**
     * Search items
     * GET /items/search
     */
    async search(req, res) {
        try {
            const { q, limit } = req.query;

            if (!q) {
                return validationErrorResponse(res, 'Search query (q) is required');
            }

            const items = await itemService.search(q, { limit: parseInt(limit) || 10 });

            return successResponse(res, items, 'Search results retrieved successfully');
        } catch (err) {
            console.error('Search items error:', err);
            return errorResponse(res, 'Failed to search items');
        }
    }
}

module.exports = new ItemController();
