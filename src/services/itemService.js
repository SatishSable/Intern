const { Category, Subcategory, Item, AddonGroup } = require('../models');
const PricingEngine = require('../utils/pricingEngine');
const TaxEngine = require('../utils/taxEngine');

/**
 * Item Service
 * Contains all business logic for item operations
 */
class ItemService {
    /**
     * Create a new item
     */
    async create(data) {
        // Validate category or subcategory exists
        if (data.category) {
            const category = await Category.findById(data.category);
            if (!category) {
                throw {
                    status: 404,
                    message: 'Category not found'
                };
            }
        }

        if (data.subcategory) {
            const subcategory = await Subcategory.findById(data.subcategory);
            if (!subcategory) {
                throw {
                    status: 404,
                    message: 'Subcategory not found'
                };
            }
            // If subcategory is provided, also set the category from subcategory
            if (!data.category) {
                data.category = subcategory.category;
            }
        }

        // Validate pricing configuration
        const pricingValidation = PricingEngine.validatePricingConfig(data.pricing);
        if (!pricingValidation.valid) {
            throw {
                status: 400,
                message: 'Invalid pricing configuration',
                errors: pricingValidation.errors
            };
        }

        // Validate addon groups if provided
        if (data.addon_groups && data.addon_groups.length > 0) {
            const addonGroups = await AddonGroup.find({
                _id: { $in: data.addon_groups }
            });

            if (addonGroups.length !== data.addon_groups.length) {
                throw {
                    status: 400,
                    message: 'One or more add-on groups not found'
                };
            }
        }

        const item = new Item(data);
        await item.save();

        // Populate references
        await item.populate([
            { path: 'category', select: 'name tax_applicable tax_percentage' },
            { path: 'subcategory', select: 'name tax_applicable tax_percentage' },
            { path: 'addon_groups' }
        ]);

        return item;
    }

    /**
     * Get all items with pagination, filtering, and search
     */
    async getAll(query = {}) {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            search,
            active,
            category,
            subcategory,
            pricing_type,
            min_price,
            max_price,
            bookable,
            tax_applicable
        } = query;

        // Build filter
        const filter = {};

        if (active !== undefined) {
            filter.is_active = active === 'true';
        }

        if (category) {
            filter.category = category;
        }

        if (subcategory) {
            filter.subcategory = subcategory;
        }

        if (pricing_type) {
            filter['pricing.type'] = pricing_type.toUpperCase();
        }

        if (min_price || max_price) {
            filter['pricing.base_price'] = {};
            if (min_price) {
                filter['pricing.base_price'].$gte = Number(min_price);
            }
            if (max_price) {
                filter['pricing.base_price'].$lte = Number(max_price);
            }
        }

        if (bookable !== undefined) {
            filter.is_bookable = bookable === 'true';
        }

        if (tax_applicable !== undefined) {
            filter.tax_applicable = tax_applicable === 'true';
        }

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { tags: new RegExp(search, 'i') }
            ];
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

        // Handle price sorting
        if (sortObj.price) {
            sortObj['pricing.base_price'] = sortObj.price;
            delete sortObj.price;
        }

        // Execute query
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Item.find(filter)
                .populate('category', 'name')
                .populate('subcategory', 'name')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit)),
            Item.countDocuments(filter)
        ]);

        return {
            items,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get item by ID
     */
    async getById(id) {
        const item = await Item.findById(id)
            .populate('category', 'name tax_applicable tax_percentage')
            .populate('subcategory', 'name tax_applicable tax_percentage')
            .populate('addon_groups');

        if (!item) {
            throw {
                status: 404,
                message: 'Item not found'
            };
        }

        return item;
    }

    /**
     * Get item with effective tax
     */
    async getWithTax(id) {
        const item = await Item.findById(id)
            .populate('category', 'name tax_applicable tax_percentage')
            .populate('subcategory', 'name tax_applicable tax_percentage');

        if (!item) {
            throw {
                status: 404,
                message: 'Item not found'
            };
        }

        const effectiveTax = await TaxEngine.getEffectiveTax(item);

        return {
            ...item.toObject(),
            effective_tax: effectiveTax
        };
    }

    /**
     * Calculate item price dynamically
     * This is the main Price Calculation API endpoint
     */
    async calculatePrice(id, options = {}) {
        const { quantity = 1, datetime = new Date(), addons = [] } = options;

        const item = await Item.findById(id)
            .populate('category', 'name tax_applicable tax_percentage')
            .populate('subcategory', 'name tax_applicable tax_percentage')
            .populate('addon_groups');

        if (!item) {
            throw {
                status: 404,
                message: 'Item not found'
            };
        }

        if (!item.is_active) {
            throw {
                status: 400,
                message: 'Item is not available'
            };
        }

        // Calculate base price using pricing engine
        const priceResult = PricingEngine.calculatePrice(item.pricing, {
            quantity,
            datetime
        });

        // Calculate add-ons price
        let addonsTotal = 0;
        const addonDetails = [];

        for (const addonSelection of addons) {
            const addonGroup = item.addon_groups.find(
                g => g._id.toString() === addonSelection.addon_group
            );

            if (addonGroup) {
                // Validate selections
                const validation = addonGroup.validateSelections(addonSelection.addon_ids);
                if (!validation.valid) {
                    throw {
                        status: 400,
                        message: validation.error
                    };
                }

                // Calculate add-on price
                const addonPrice = addonGroup.calculateSelectedPrice(addonSelection.addon_ids);
                addonsTotal += addonPrice;

                // Get selected addon names
                const selectedAddons = addonGroup.addons.filter(a =>
                    addonSelection.addon_ids.includes(a._id.toString())
                );

                addonDetails.push({
                    group_name: addonGroup.name,
                    selected_addons: selectedAddons.map(a => ({ name: a.name, price: a.price })),
                    total_price: addonPrice
                });
            }
        }

        // Calculate subtotal
        const subtotal = priceResult.calculated_price + addonsTotal;

        // Get effective tax
        const effectiveTax = await TaxEngine.getEffectiveTax(item);

        // Calculate tax
        const taxCalculation = TaxEngine.calculateTax(
            subtotal,
            effectiveTax.tax_percentage
        );

        return {
            item: {
                id: item._id,
                name: item.name,
                category: item.category?.name,
                subcategory: item.subcategory?.name
            },
            pricing_details: {
                pricing_type: priceResult.pricing_type,
                pricing_rule_applied: priceResult.pricing_rule_applied,
                unit_price: priceResult.unit_price,
                quantity: priceResult.quantity,
                base_price: priceResult.base_price,
                discount_amount: priceResult.discount_amount
            },
            addons_details: addonDetails,
            addons_total: addonsTotal,
            subtotal: subtotal,
            tax: {
                applicable: effectiveTax.tax_applicable,
                percentage: effectiveTax.tax_percentage,
                inherited_from: effectiveTax.inherited_from,
                amount: taxCalculation.tax_amount
            },
            final_price: taxCalculation.total_with_tax,
            calculated_at: new Date()
        };
    }

    /**
     * Update item
     */
    async update(id, data) {
        const item = await Item.findById(id);

        if (!item) {
            throw {
                status: 404,
                message: 'Item not found'
            };
        }

        // Validate category/subcategory if being updated
        if (data.category) {
            const category = await Category.findById(data.category);
            if (!category) {
                throw {
                    status: 404,
                    message: 'Category not found'
                };
            }
        }

        if (data.subcategory) {
            const subcategory = await Subcategory.findById(data.subcategory);
            if (!subcategory) {
                throw {
                    status: 404,
                    message: 'Subcategory not found'
                };
            }
        }

        // Validate pricing if being updated
        if (data.pricing) {
            const pricingValidation = PricingEngine.validatePricingConfig(data.pricing);
            if (!pricingValidation.valid) {
                throw {
                    status: 400,
                    message: 'Invalid pricing configuration',
                    errors: pricingValidation.errors
                };
            }
        }

        // Validate addon groups if being updated
        if (data.addon_groups && data.addon_groups.length > 0) {
            const addonGroups = await AddonGroup.find({
                _id: { $in: data.addon_groups }
            });

            if (addonGroups.length !== data.addon_groups.length) {
                throw {
                    status: 400,
                    message: 'One or more add-on groups not found'
                };
            }
        }

        Object.assign(item, data);
        await item.save();

        await item.populate([
            { path: 'category', select: 'name tax_applicable tax_percentage' },
            { path: 'subcategory', select: 'name tax_applicable tax_percentage' },
            { path: 'addon_groups' }
        ]);

        return item;
    }

    /**
     * Soft delete item
     */
    async delete(id) {
        const item = await Item.findById(id);

        if (!item) {
            throw {
                status: 404,
                message: 'Item not found'
            };
        }

        item.is_active = false;
        await item.save();

        return { message: 'Item deactivated successfully' };
    }

    /**
     * Hard delete item (permanent)
     */
    async hardDelete(id) {
        const item = await Item.findById(id);

        if (!item) {
            throw {
                status: 404,
                message: 'Item not found'
            };
        }

        await Item.findByIdAndDelete(id);

        return { message: 'Item deleted permanently' };
    }

    /**
     * Restore soft-deleted item
     */
    async restore(id) {
        const item = await Item.findById(id);

        if (!item) {
            throw {
                status: 404,
                message: 'Item not found'
            };
        }

        item.is_active = true;
        await item.save();

        return item;
    }

    /**
     * Get items by category
     */
    async getByCategory(categoryId, query = {}) {
        const filter = { category: categoryId, is_active: true };

        const items = await Item.find(filter)
            .populate('subcategory', 'name')
            .sort({ display_order: 1 });

        return items;
    }

    /**
     * Get items by subcategory
     */
    async getBySubcategory(subcategoryId, query = {}) {
        const filter = { subcategory: subcategoryId, is_active: true };

        const items = await Item.find(filter)
            .sort({ display_order: 1 });

        return items;
    }

    /**
     * Search items
     */
    async search(searchQuery, options = {}) {
        const { limit = 10 } = options;

        const items = await Item.find({
            $text: { $search: searchQuery },
            is_active: true
        })
            .select({ score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .populate('category', 'name')
            .populate('subcategory', 'name');

        return items;
    }
}

module.exports = new ItemService();
