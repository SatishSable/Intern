const { AddonGroup } = require('../models');

/**
 * Add-on Service
 * Contains all business logic for add-on group operations
 */
class AddonService {
    /**
     * Create a new add-on group
     */
    async create(data) {
        // Check for duplicate name
        const existing = await AddonGroup.findOne({ name: data.name });
        if (existing) {
            throw {
                status: 400,
                message: 'Add-on group with this name already exists'
            };
        }

        const addonGroup = new AddonGroup(data);
        await addonGroup.save();

        return addonGroup;
    }

    /**
     * Get all add-on groups
     */
    async getAll(query = {}) {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            search,
            active,
            type
        } = query;

        // Build filter
        const filter = {};

        if (active !== undefined) {
            filter.is_active = active === 'true';
        }

        if (type) {
            filter.type = type.toUpperCase();
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

        const [addonGroups, total] = await Promise.all([
            AddonGroup.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit)),
            AddonGroup.countDocuments(filter)
        ]);

        return {
            addonGroups,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get add-on group by ID
     */
    async getById(id) {
        const addonGroup = await AddonGroup.findById(id);

        if (!addonGroup) {
            throw {
                status: 404,
                message: 'Add-on group not found'
            };
        }

        return addonGroup;
    }

    /**
     * Update add-on group
     */
    async update(id, data) {
        const addonGroup = await AddonGroup.findById(id);

        if (!addonGroup) {
            throw {
                status: 404,
                message: 'Add-on group not found'
            };
        }

        // Check for duplicate name if name is being updated
        if (data.name && data.name !== addonGroup.name) {
            const existing = await AddonGroup.findOne({
                name: data.name,
                _id: { $ne: id }
            });

            if (existing) {
                throw {
                    status: 400,
                    message: 'Add-on group with this name already exists'
                };
            }
        }

        Object.assign(addonGroup, data);
        await addonGroup.save();

        return addonGroup;
    }

    /**
     * Soft delete add-on group
     */
    async delete(id) {
        const addonGroup = await AddonGroup.findById(id);

        if (!addonGroup) {
            throw {
                status: 404,
                message: 'Add-on group not found'
            };
        }

        addonGroup.is_active = false;
        await addonGroup.save();

        return { message: 'Add-on group deactivated successfully' };
    }

    /**
     * Hard delete add-on group (permanent)
     */
    async hardDelete(id) {
        const addonGroup = await AddonGroup.findById(id);

        if (!addonGroup) {
            throw {
                status: 404,
                message: 'Add-on group not found'
            };
        }

        await AddonGroup.findByIdAndDelete(id);

        return { message: 'Add-on group deleted permanently' };
    }

    /**
     * Restore soft-deleted add-on group
     */
    async restore(id) {
        const addonGroup = await AddonGroup.findById(id);

        if (!addonGroup) {
            throw {
                status: 404,
                message: 'Add-on group not found'
            };
        }

        addonGroup.is_active = true;
        await addonGroup.save();

        return addonGroup;
    }

    /**
     * Add a single add-on to a group
     */
    async addAddon(groupId, addonData) {
        const addonGroup = await AddonGroup.findById(groupId);

        if (!addonGroup) {
            throw {
                status: 404,
                message: 'Add-on group not found'
            };
        }

        addonGroup.addons.push(addonData);
        await addonGroup.save();

        return addonGroup;
    }

    /**
     * Update a single add-on within a group
     */
    async updateAddon(groupId, addonId, addonData) {
        const addonGroup = await AddonGroup.findById(groupId);

        if (!addonGroup) {
            throw {
                status: 404,
                message: 'Add-on group not found'
            };
        }

        const addon = addonGroup.addons.id(addonId);

        if (!addon) {
            throw {
                status: 404,
                message: 'Add-on not found'
            };
        }

        Object.assign(addon, addonData);
        await addonGroup.save();

        return addonGroup;
    }

    /**
     * Remove a single add-on from a group
     */
    async removeAddon(groupId, addonId) {
        const addonGroup = await AddonGroup.findById(groupId);

        if (!addonGroup) {
            throw {
                status: 404,
                message: 'Add-on group not found'
            };
        }

        const addon = addonGroup.addons.id(addonId);

        if (!addon) {
            throw {
                status: 404,
                message: 'Add-on not found'
            };
        }

        addon.deleteOne();
        await addonGroup.save();

        return addonGroup;
    }

    /**
     * Calculate price for selected add-ons
     */
    async calculateAddonPrice(groupId, selectedAddonIds) {
        const addonGroup = await AddonGroup.findById(groupId);

        if (!addonGroup) {
            throw {
                status: 404,
                message: 'Add-on group not found'
            };
        }

        // Validate selections
        const validation = addonGroup.validateSelections(selectedAddonIds);
        if (!validation.valid) {
            throw {
                status: 400,
                message: validation.error
            };
        }

        // Calculate price
        const totalPrice = addonGroup.calculateSelectedPrice(selectedAddonIds);

        // Get selected addon details
        const selectedAddons = addonGroup.addons.filter(a =>
            selectedAddonIds.includes(a._id.toString())
        );

        return {
            group_name: addonGroup.name,
            selected_addons: selectedAddons.map(a => ({
                id: a._id,
                name: a.name,
                price: a.price
            })),
            total_price: totalPrice
        };
    }
}

module.exports = new AddonService();
