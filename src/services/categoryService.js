const { Category, Subcategory, Item } = require('../models');

/**
 * Category Service
 * Contains all business logic for category operations
 */
class CategoryService {
    /**
     * Create a new category
     */
    async create(data) {
        // Check for duplicate name
        const existing = await Category.findOne({ name: data.name });
        if (existing) {
            throw {
                status: 400,
                message: 'Category with this name already exists'
            };
        }

        const category = new Category(data);
        await category.save();

        return category;
    }

    /**
     * Get all categories with pagination and filtering
     */
    async getAll(query = {}) {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            search,
            active
        } = query;

        // Build filter
        const filter = {};

        if (active !== undefined) {
            filter.is_active = active === 'true';
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

        const [categories, total] = await Promise.all([
            Category.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit)),
            Category.countDocuments(filter)
        ]);

        return {
            categories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get category by ID
     */
    async getById(id) {
        const category = await Category.findById(id);

        if (!category) {
            throw {
                status: 404,
                message: 'Category not found'
            };
        }

        return category;
    }

    /**
     * Get category with its subcategories
     */
    async getWithSubcategories(id) {
        const category = await Category.findById(id);

        if (!category) {
            throw {
                status: 404,
                message: 'Category not found'
            };
        }

        const subcategories = await Subcategory.find({
            category: id,
            is_active: true
        }).sort({ display_order: 1 });

        return {
            ...category.toObject(),
            subcategories
        };
    }

    /**
     * Update category
     */
    async update(id, data) {
        // Check if category exists
        const category = await Category.findById(id);

        if (!category) {
            throw {
                status: 404,
                message: 'Category not found'
            };
        }

        // Check for duplicate name if name is being updated
        if (data.name && data.name !== category.name) {
            const existing = await Category.findOne({
                name: data.name,
                _id: { $ne: id }
            });

            if (existing) {
                throw {
                    status: 400,
                    message: 'Category with this name already exists'
                };
            }
        }

        // Handle tax_percentage when tax_applicable is false
        if (data.tax_applicable === false) {
            data.tax_percentage = undefined;
        }

        Object.assign(category, data);
        await category.save();

        return category;
    }

    /**
     * Soft delete category
     */
    async delete(id) {
        const category = await Category.findById(id);

        if (!category) {
            throw {
                status: 404,
                message: 'Category not found'
            };
        }

        // Soft delete - set is_active to false
        category.is_active = false;
        await category.save();

        // Also soft delete all subcategories in this category
        await Subcategory.updateMany(
            { category: id },
            { is_active: false }
        );

        // Also soft delete all items directly in this category
        await Item.updateMany(
            { category: id },
            { is_active: false }
        );

        return { message: 'Category deactivated successfully' };
    }

    /**
     * Hard delete category (permanent)
     */
    async hardDelete(id) {
        const category = await Category.findById(id);

        if (!category) {
            throw {
                status: 404,
                message: 'Category not found'
            };
        }

        // Check if category has subcategories
        const subcategoryCount = await Subcategory.countDocuments({ category: id });
        if (subcategoryCount > 0) {
            throw {
                status: 400,
                message: 'Cannot delete category with existing subcategories'
            };
        }

        // Check if category has items
        const itemCount = await Item.countDocuments({ category: id });
        if (itemCount > 0) {
            throw {
                status: 400,
                message: 'Cannot delete category with existing items'
            };
        }

        await Category.findByIdAndDelete(id);

        return { message: 'Category deleted permanently' };
    }

    /**
     * Restore soft-deleted category
     */
    async restore(id) {
        const category = await Category.findById(id);

        if (!category) {
            throw {
                status: 404,
                message: 'Category not found'
            };
        }

        category.is_active = true;
        await category.save();

        return category;
    }
}

module.exports = new CategoryService();
