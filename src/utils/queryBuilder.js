const { PAGINATION } = require('../config/constants');

/**
 * Query Builder Utilities
 * Handles pagination, sorting, filtering, and search
 */
class QueryBuilder {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
        this.totalCount = 0;
    }

    /**
     * Apply filtering based on query parameters
     */
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'limit', 'sort', 'fields', 'search'];
        excludedFields.forEach(field => delete queryObj[field]);

        // Handle special filters
        const filters = {};

        // Active only filter
        if (queryObj.active === 'true') {
            filters.is_active = true;
        } else if (queryObj.active === 'false') {
            filters.is_active = false;
        }
        delete queryObj.active;

        // Tax applicable filter
        if (queryObj.tax_applicable !== undefined) {
            filters.tax_applicable = queryObj.tax_applicable === 'true';
        }
        delete queryObj.tax_applicable;

        // Price range filter
        if (queryObj.min_price || queryObj.max_price) {
            filters['pricing.base_price'] = {};
            if (queryObj.min_price) {
                filters['pricing.base_price'].$gte = Number(queryObj.min_price);
            }
            if (queryObj.max_price) {
                filters['pricing.base_price'].$lte = Number(queryObj.max_price);
            }
        }
        delete queryObj.min_price;
        delete queryObj.max_price;

        // Category filter
        if (queryObj.category) {
            filters.category = queryObj.category;
        }
        delete queryObj.category;

        // Subcategory filter
        if (queryObj.subcategory) {
            filters.subcategory = queryObj.subcategory;
        }
        delete queryObj.subcategory;

        // Pricing type filter
        if (queryObj.pricing_type) {
            filters['pricing.type'] = queryObj.pricing_type.toUpperCase();
        }
        delete queryObj.pricing_type;

        // Bookable filter
        if (queryObj.bookable !== undefined) {
            filters.is_bookable = queryObj.bookable === 'true';
        }
        delete queryObj.bookable;

        // Apply remaining filters
        Object.assign(filters, queryObj);

        this.query = this.query.find(filters);
        return this;
    }

    /**
     * Apply text search
     */
    search() {
        if (this.queryString.search) {
            const searchRegex = new RegExp(this.queryString.search, 'i');
            this.query = this.query.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { tags: searchRegex }
                ]
            });
        }
        return this;
    }

    /**
     * Apply sorting
     */
    sort() {
        if (this.queryString.sort) {
            const sortFields = this.queryString.sort.split(',');
            const sortObj = {};

            sortFields.forEach(field => {
                if (field.startsWith('-')) {
                    sortObj[field.substring(1)] = -1;
                } else {
                    sortObj[field] = 1;
                }
            });

            this.query = this.query.sort(sortObj);
        } else {
            // Default sort by createdAt descending
            this.query = this.query.sort({ createdAt: -1 });
        }
        return this;
    }

    /**
     * Apply field selection
     */
    selectFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        return this;
    }

    /**
     * Apply pagination
     */
    paginate() {
        const page = Math.max(1, parseInt(this.queryString.page, 10) || PAGINATION.DEFAULT_PAGE);
        const limit = Math.min(
            Math.max(1, parseInt(this.queryString.limit, 10) || PAGINATION.DEFAULT_LIMIT),
            PAGINATION.MAX_LIMIT
        );
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        this.paginationInfo = { page, limit };

        return this;
    }

    /**
     * Get pagination info with total count
     */
    async getPaginationInfo(Model, filter = {}) {
        const total = await Model.countDocuments(filter);
        return {
            ...this.paginationInfo,
            total
        };
    }
}

/**
 * Parse sort parameter for MongoDB
 */
const parseSortParam = (sortParam) => {
    if (!sortParam) {
        return { createdAt: -1 };
    }

    const sortObj = {};
    const fields = sortParam.split(',');

    fields.forEach(field => {
        if (field.startsWith('-')) {
            sortObj[field.substring(1)] = -1;
        } else {
            sortObj[field] = 1;
        }
    });

    return sortObj;
};

/**
 * Build filter object from query parameters
 */
const buildFilterObject = (queryParams, allowedFilters = []) => {
    const filter = {};

    allowedFilters.forEach(key => {
        if (queryParams[key] !== undefined && queryParams[key] !== '') {
            filter[key] = queryParams[key];
        }
    });

    return filter;
};

module.exports = {
    QueryBuilder,
    parseSortParam,
    buildFilterObject
};
