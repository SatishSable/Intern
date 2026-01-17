const { Category, Subcategory, Item } = require('../models');
const TaxEngine = require('../utils/taxEngine');

/**
 * Subcategory Service
 * Contains all business logic for subcategory operations
 */
class SubcategoryService {
    /**
     * Create a new subcategory
     */
    async create(data) {
        // Verify category exists
        const category = await Category.findById(data.category);
        if (!category) {
            throw {
                status: 404,
                message: 'Category not found'
            };
        }

        // Check for duplicate name within category
        const existing = await Subcategory.findOne({
            name: data.name,
            category: data.category
        });

        if (existing) {
            throw {
                status: 400,
                message: 'Subcategory with this name already exists in this category'
            };
        }

        const subcategory = new Subcategory(data);
        await subcategory.save();

        // Populate category info
        await subcategory.populate('category', 'name tax_applicable tax_percentage');

        return subcategory;
    }

    /**
     * Get all subcategories with pagination and filtering
     */
    async getAll(query = {}) {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            search,
            active,
            category
        } = query;

        // Build filter
        const filter = {};

        if (active !== undefined) {
            filter.is_active = active === 'true';
        }

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.name = new RegExp(search, 'i');
        }

        // Build sort
        const sortObj = {};
        const sortFields = sort.split(',');
        sortFields.forEach(field => {
            if (field.startsWith('-')) {
                sortObj[field.substring(1)] = -1;
            } else {
                sortObj[field] = 1;
            }
        });

        // Execute query
        const skip = (page - 1) * limit;

        const [subcategories, total] = await Promise.all([
            Subcategory.find(filter)
                .populate('category', 'name tax_applicable tax_percentage')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit)),
            Subcategory.countDocuments(filter)
        ]);

        return {
            subcategories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get subcategories by category ID
     */
    async getByCategory(categoryId, query = {}) {
        const { active = 'true' } = query;

        // Verify category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            throw {
                status: 404,
                message: 'Category not found'
            };
        }

        const filter = { category: categoryId };
        if (active === 'true') {
            filter.is_active = true;
        }

        const subcategories = await Subcategory.find(filter)
            .sort({ display_order: 1, createdAt: -1 });

        return subcategories;
    }

    /**
     * Get subcategory by ID
     */
    async getById(id) {
        const subcategory = await Subcategory.findById(id)
            .populate('category', 'name tax_applicable tax_percentage');

        if (!subcategory) {
            throw {
                status: 404,
                message: 'Subcategory not found'
            };
        }

        return subcategory;
    }

    /**
     * Get subcategory with effective tax
     */
    async getWithTax(id) {
        const subcategory = await Subcategory.findById(id)
            .populate('category', 'name tax_applicable tax_percentage');

        if (!subcategory) {
            throw {
                status: 404,
                message: 'Subcategory not found'
            };
        }

        const effectiveTax = await TaxEngine.getSubcategoryTax(subcategory);

        return {
            ...subcategory.toObject(),
            effective_tax: effectiveTax
        };
    }

    /**
     * Get subcategory with its items
     */
    async getWithItems(id) {
        const subcategory = await Subcategory.findById(id)
            .populate('category', 'name');

        if (!subcategory) {
            throw {
                status: 404,
                message: 'Subcategory not found'
            };
        }

        const items = await Item.find({
            subcategory: id,
            is_active: true
        }).sort({ display_order: 1 });

        return {
            ...subcategory.toObject(),
            items
        };
    }

    /**
     * Update subcategory
     */
    async update(id, data) {
        // Check if subcategory exists
        const subcategory = await Subcategory.findById(id);

        if (!subcategory) {
            throw {
                status: 404,
                message: 'Subcategory not found'
            };
        }

        // If changing category, verify new category exists
        if (data.category && data.category !== subcategory.category.toString()) {
            const category = await Category.findById(data.category);
            if (!category) {
                throw {
                    status: 404,
                    message: 'New category not found'
                };
            }
        }

        // Check for duplicate name if name is being updated
        if (data.name && data.name !== subcategory.name) {
            const existing = await Subcategory.findOne({
                name: data.name,
                category: data.category || subcategory.category,
                _id: { $ne: id }
            });

            if (existing) {
                throw {
                    status: 400,
                    message: 'Subcategory with this name already exists in this category'
                };
            }
        }

        Object.assign(subcategory, data);
        await subcategory.save();

        await subcategory.populate('category', 'name tax_applicable tax_percentage');

        return subcategory;
    }

    /**
     * Soft delete subcategory
     */
    async delete(id) {
        const subcategory = await Subcategory.findById(id);

        if (!subcategory) {
            throw {
                status: 404,
                message: 'Subcategory not found'
            };
        }

        // Soft delete
        subcategory.is_active = false;
        await subcategory.save();

        // Also soft delete all items in this subcategory
        await Item.updateMany(
            { subcategory: id },
            { is_active: false }
        );

        return { message: 'Subcategory deactivated successfully' };
    }

    /**
     * Hard delete subcategory (permanent)
     */
    async hardDelete(id) {
        const subcategory = await Subcategory.findById(id);

        if (!subcategory) {
            throw {
                status: 404,
                message: 'Subcategory not found'
            };
        }

        // Check if subcategory has items
        const itemCount = await Item.countDocuments({ subcategory: id });
        if (itemCount > 0) {
            throw {
                status: 400,
                message: 'Cannot delete subcategory with existing items'
            };
        }

        await Subcategory.findByIdAndDelete(id);

        return { message: 'Subcategory deleted permanently' };
    }

    /**
     * Restore soft-deleted subcategory
     */
    async restore(id) {
        const subcategory = await Subcategory.findById(id);

        if (!subcategory) {
            throw {
                status: 404,
                message: 'Subcategory not found'
            };
        }

        // Check if parent category is active
        const category = await Category.findById(subcategory.category);
        if (!category || !category.is_active) {
            throw {
                status: 400,
                message: 'Cannot restore subcategory - parent category is inactive'
            };
        }

        subcategory.is_active = true;
        await subcategory.save();

        return subcategory;
    }
}

module.exports = new SubcategoryService();
