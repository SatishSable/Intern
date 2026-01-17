const categoryService = require('../services/categoryService');
const {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema
} = require('../validations');
const {
    successResponse,
    errorResponse,
    paginatedResponse,
    validationErrorResponse,
    notFoundResponse
} = require('../utils/apiResponse');

/**
 * Category Controller
 * Handles HTTP requests for category operations
 */
class CategoryController {
    /**
     * Create a new category
     * POST /categories
     */
    async create(req, res) {
        try {
            // Validate request body
            const { error, value } = createCategorySchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const category = await categoryService.create(value);

            return successResponse(res, category, 'Category created successfully', 201);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Create category error:', err);
            return errorResponse(res, 'Failed to create category');
        }
    }

    /**
     * Get all categories
     * GET /categories
     */
    async getAll(req, res) {
        try {
            const result = await categoryService.getAll(req.query);

            return paginatedResponse(
                res,
                result.categories,
                result.pagination,
                'Categories retrieved successfully'
            );
        } catch (err) {
            console.error('Get categories error:', err);
            return errorResponse(res, 'Failed to retrieve categories');
        }
    }

    /**
     * Get category by ID
     * GET /categories/:id
     */
    async getById(req, res) {
        try {
            // Validate ID
            const { error } = categoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const category = await categoryService.getById(req.params.id);

            return successResponse(res, category, 'Category retrieved successfully');
        } catch (err) {
            if (err.status === 404) {
                return notFoundResponse(res, 'Category');
            }
            console.error('Get category error:', err);
            return errorResponse(res, 'Failed to retrieve category');
        }
    }

    /**
     * Get category with subcategories
     * GET /categories/:id/subcategories
     */
    async getWithSubcategories(req, res) {
        try {
            const { error } = categoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await categoryService.getWithSubcategories(req.params.id);

            return successResponse(res, result, 'Category with subcategories retrieved successfully');
        } catch (err) {
            if (err.status === 404) {
                return notFoundResponse(res, 'Category');
            }
            console.error('Get category with subcategories error:', err);
            return errorResponse(res, 'Failed to retrieve category');
        }
    }

    /**
     * Update category
     * PUT /categories/:id
     */
    async update(req, res) {
        try {
            // Validate ID
            const { error: idError } = categoryIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            // Validate body
            const { error, value } = updateCategorySchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const category = await categoryService.update(req.params.id, value);

            return successResponse(res, category, 'Category updated successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Update category error:', err);
            return errorResponse(res, 'Failed to update category');
        }
    }

    /**
     * Soft delete category
     * DELETE /categories/:id
     */
    async delete(req, res) {
        try {
            const { error } = categoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await categoryService.delete(req.params.id);

            return successResponse(res, result, result.message);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Delete category error:', err);
            return errorResponse(res, 'Failed to delete category');
        }
    }

    /**
     * Hard delete category (permanent)
     * DELETE /categories/:id/permanent
     */
    async hardDelete(req, res) {
        try {
            const { error } = categoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await categoryService.hardDelete(req.params.id);

            return successResponse(res, result, result.message);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Hard delete category error:', err);
            return errorResponse(res, 'Failed to delete category');
        }
    }

    /**
     * Restore soft-deleted category
     * POST /categories/:id/restore
     */
    async restore(req, res) {
        try {
            const { error } = categoryIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const category = await categoryService.restore(req.params.id);

            return successResponse(res, category, 'Category restored successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Restore category error:', err);
            return errorResponse(res, 'Failed to restore category');
        }
    }
}

module.exports = new CategoryController();
