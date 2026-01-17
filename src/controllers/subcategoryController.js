const subcategoryService = require('../services/subcategoryService');
const {
    createSubcategorySchema,
    updateSubcategorySchema,
    subcategoryIdSchema,
    categoryFilterSchema
} = require('../validations');
const {
    successResponse,
    errorResponse,
    paginatedResponse,
    validationErrorResponse,
    notFoundResponse
} = require('../utils/apiResponse');

/**
 * Subcategory Controller
 * Handles HTTP requests for subcategory operations
 */
class SubcategoryController {
    /**
     * Create a new subcategory
     * POST /subcategories
     */
    async create(req, res) {
        try {
            const { error, value } = createSubcategorySchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const subcategory = await subcategoryService.create(value);

            return successResponse(res, subcategory, 'Subcategory created successfully', 201);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Create subcategory error:', err);
            return errorResponse(res, 'Failed to create subcategory');
        }
    }

    /**
     * Get all subcategories
     * GET /subcategories
     */
    async getAll(req, res) {
        try {
            const result = await subcategoryService.getAll(req.query);

            return paginatedResponse(
                res,
                result.subcategories,
                result.pagination,
                'Subcategories retrieved successfully'
            );
        } catch (err) {
            console.error('Get subcategories error:', err);
            return errorResponse(res, 'Failed to retrieve subcategories');
        }
    }

    /**
     * Get subcategories by category
     * GET /categories/:categoryId/subcategories
     */
    async getByCategory(req, res) {
        try {
            const { error } = categoryFilterSchema.validate({ categoryId: req.params.categoryId });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const subcategories = await subcategoryService.getByCategory(
                req.params.categoryId,
                req.query
            );

            return successResponse(res, subcategories, 'Subcategories retrieved successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Get subcategories by category error:', err);
            return errorResponse(res, 'Failed to retrieve subcategories');
        }
    }

    /**
     * Get subcategory by ID
     * GET /subcategories/:id
     */
    async getById(req, res) {
        try {
            const { error } = subcategoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const subcategory = await subcategoryService.getById(req.params.id);

            return successResponse(res, subcategory, 'Subcategory retrieved successfully');
        } catch (err) {
            if (err.status === 404) {
                return notFoundResponse(res, 'Subcategory');
            }
            console.error('Get subcategory error:', err);
            return errorResponse(res, 'Failed to retrieve subcategory');
        }
    }

    /**
     * Get subcategory with effective tax
     * GET /subcategories/:id/tax
     */
    async getWithTax(req, res) {
        try {
            const { error } = subcategoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await subcategoryService.getWithTax(req.params.id);

            return successResponse(res, result, 'Subcategory with tax info retrieved successfully');
        } catch (err) {
            if (err.status === 404) {
                return notFoundResponse(res, 'Subcategory');
            }
            console.error('Get subcategory with tax error:', err);
            return errorResponse(res, 'Failed to retrieve subcategory');
        }
    }

    /**
     * Get subcategory with items
     * GET /subcategories/:id/items
     */
    async getWithItems(req, res) {
        try {
            const { error } = subcategoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await subcategoryService.getWithItems(req.params.id);

            return successResponse(res, result, 'Subcategory with items retrieved successfully');
        } catch (err) {
            if (err.status === 404) {
                return notFoundResponse(res, 'Subcategory');
            }
            console.error('Get subcategory with items error:', err);
            return errorResponse(res, 'Failed to retrieve subcategory');
        }
    }

    /**
     * Update subcategory
     * PUT /subcategories/:id
     */
    async update(req, res) {
        try {
            const { error: idError } = subcategoryIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            const { error, value } = updateSubcategorySchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const subcategory = await subcategoryService.update(req.params.id, value);

            return successResponse(res, subcategory, 'Subcategory updated successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Update subcategory error:', err);
            return errorResponse(res, 'Failed to update subcategory');
        }
    }

    /**
     * Soft delete subcategory
     * DELETE /subcategories/:id
     */
    async delete(req, res) {
        try {
            const { error } = subcategoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await subcategoryService.delete(req.params.id);

            return successResponse(res, result, result.message);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Delete subcategory error:', err);
            return errorResponse(res, 'Failed to delete subcategory');
        }
    }

    /**
     * Hard delete subcategory
     * DELETE /subcategories/:id/permanent
     */
    async hardDelete(req, res) {
        try {
            const { error } = subcategoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await subcategoryService.hardDelete(req.params.id);

            return successResponse(res, result, result.message);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Hard delete subcategory error:', err);
            return errorResponse(res, 'Failed to delete subcategory');
        }
    }

    /**
     * Restore soft-deleted subcategory
     * POST /subcategories/:id/restore
     */
    async restore(req, res) {
        try {
            const { error } = subcategoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const subcategory = await subcategoryService.restore(req.params.id);

            return successResponse(res, subcategory, 'Subcategory restored successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Restore subcategory error:', err);
            return errorResponse(res, 'Failed to restore subcategory');
        }
    }
}

module.exports = new SubcategoryController();
