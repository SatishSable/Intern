/**
 * API Response Utilities
 */

/**
 * Create a success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Create an error response
 */
const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Create a paginated response
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: Math.ceil(pagination.total / pagination.limit),
            hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
            hasPrevPage: pagination.page > 1
        }
    });
};

/**
 * Create a validation error response
 */
const validationErrorResponse = (res, errors) => {
    return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: Array.isArray(errors) ? errors : [errors]
    });
};

/**
 * Create a not found response
 */
const notFoundResponse = (res, resource = 'Resource') => {
    return res.status(404).json({
        success: false,
        message: `${resource} not found`
    });
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse,
    validationErrorResponse,
    notFoundResponse
};
