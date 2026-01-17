const addonService = require('../services/addonService');
const {
    createAddonGroupSchema,
    updateAddonGroupSchema,
    addonGroupIdSchema,
    addAddonToGroupSchema
} = require('../validations');
const {
    successResponse,
    errorResponse,
    paginatedResponse,
    validationErrorResponse,
    notFoundResponse
} = require('../utils/apiResponse');

/**
 * Add-on Controller
 * Handles HTTP requests for add-on operations
 */
class AddonController {
    /**
     * Create a new add-on group
     * POST /addon-groups
     */
    async create(req, res) {
        try {
            const { error, value } = createAddonGroupSchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const addonGroup = await addonService.create(value);

            return successResponse(res, addonGroup, 'Add-on group created successfully', 201);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Create addon group error:', err);
            return errorResponse(res, 'Failed to create add-on group');
        }
    }

    /**
     * Get all add-on groups
     * GET /addon-groups
     */
    async getAll(req, res) {
        try {
            const result = await addonService.getAll(req.query);

            return paginatedResponse(
                res,
                result.addonGroups,
                result.pagination,
                'Add-on groups retrieved successfully'
            );
        } catch (err) {
            console.error('Get addon groups error:', err);
            return errorResponse(res, 'Failed to retrieve add-on groups');
        }
    }

    /**
     * Get add-on group by ID
     * GET /addon-groups/:id
     */
    async getById(req, res) {
        try {
            const { error } = addonGroupIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const addonGroup = await addonService.getById(req.params.id);

            return successResponse(res, addonGroup, 'Add-on group retrieved successfully');
        } catch (err) {
            if (err.status === 404) {
                return notFoundResponse(res, 'Add-on group');
            }
            console.error('Get addon group error:', err);
            return errorResponse(res, 'Failed to retrieve add-on group');
        }
    }

    /**
     * Update add-on group
     * PUT /addon-groups/:id
     */
    async update(req, res) {
        try {
            const { error: idError } = addonGroupIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            const { error, value } = updateAddonGroupSchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const addonGroup = await addonService.update(req.params.id, value);

            return successResponse(res, addonGroup, 'Add-on group updated successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Update addon group error:', err);
            return errorResponse(res, 'Failed to update add-on group');
        }
    }

    /**
     * Soft delete add-on group
     * DELETE /addon-groups/:id
     */
    async delete(req, res) {
        try {
            const { error } = addonGroupIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await addonService.delete(req.params.id);

            return successResponse(res, result, result.message);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Delete addon group error:', err);
            return errorResponse(res, 'Failed to delete add-on group');
        }
    }

    /**
     * Hard delete add-on group
     * DELETE /addon-groups/:id/permanent
     */
    async hardDelete(req, res) {
        try {
            const { error } = addonGroupIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const result = await addonService.hardDelete(req.params.id);

            return successResponse(res, result, result.message);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Hard delete addon group error:', err);
            return errorResponse(res, 'Failed to delete add-on group');
        }
    }

    /**
     * Restore soft-deleted add-on group
     * POST /addon-groups/:id/restore
     */
    async restore(req, res) {
        try {
            const { error } = addonGroupIdSchema.validate({ id: req.params.id });
            if (error) {
                return validationErrorResponse(res, error.details[0].message);
            }

            const addonGroup = await addonService.restore(req.params.id);

            return successResponse(res, addonGroup, 'Add-on group restored successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Restore addon group error:', err);
            return errorResponse(res, 'Failed to restore add-on group');
        }
    }

    /**
     * Add a single add-on to a group
     * POST /addon-groups/:id/addons
     */
    async addAddon(req, res) {
        try {
            const { error: idError } = addonGroupIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            const { error, value } = addAddonToGroupSchema.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return validationErrorResponse(
                    res,
                    error.details.map(d => d.message)
                );
            }

            const addonGroup = await addonService.addAddon(req.params.id, value);

            return successResponse(res, addonGroup, 'Add-on added successfully', 201);
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Add addon error:', err);
            return errorResponse(res, 'Failed to add add-on');
        }
    }

    /**
     * Update a single add-on within a group
     * PUT /addon-groups/:id/addons/:addonId
     */
    async updateAddon(req, res) {
        try {
            const { error: idError } = addonGroupIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            const addonGroup = await addonService.updateAddon(
                req.params.id,
                req.params.addonId,
                req.body
            );

            return successResponse(res, addonGroup, 'Add-on updated successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Update addon error:', err);
            return errorResponse(res, 'Failed to update add-on');
        }
    }

    /**
     * Remove a single add-on from a group
     * DELETE /addon-groups/:id/addons/:addonId
     */
    async removeAddon(req, res) {
        try {
            const { error: idError } = addonGroupIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            const addonGroup = await addonService.removeAddon(
                req.params.id,
                req.params.addonId
            );

            return successResponse(res, addonGroup, 'Add-on removed successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Remove addon error:', err);
            return errorResponse(res, 'Failed to remove add-on');
        }
    }

    /**
     * Calculate price for selected add-ons
     * POST /addon-groups/:id/calculate-price
     */
    async calculatePrice(req, res) {
        try {
            const { error: idError } = addonGroupIdSchema.validate({ id: req.params.id });
            if (idError) {
                return validationErrorResponse(res, idError.details[0].message);
            }

            const { addon_ids } = req.body;

            if (!addon_ids || !Array.isArray(addon_ids)) {
                return validationErrorResponse(res, 'addon_ids must be an array');
            }

            const result = await addonService.calculateAddonPrice(
                req.params.id,
                addon_ids
            );

            return successResponse(res, result, 'Price calculated successfully');
        } catch (err) {
            if (err.status) {
                return errorResponse(res, err.message, err.status);
            }
            console.error('Calculate addon price error:', err);
            return errorResponse(res, 'Failed to calculate price');
        }
    }
}

module.exports = new AddonController();
