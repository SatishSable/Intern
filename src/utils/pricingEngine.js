const { PRICING_TYPES, DISCOUNT_TYPES, DAYS_OF_WEEK } = require('../config/constants');

/**
 * Pricing Engine
 * Handles all pricing calculations for different pricing types
 */
class PricingEngine {
    /**
     * Calculate price based on pricing configuration
     * @param {Object} pricingConfig - The pricing configuration from item
     * @param {Object} options - Additional options (quantity, datetime, etc.)
     * @returns {Object} Price calculation result
     */
    static calculatePrice(pricingConfig, options = {}) {
        const { quantity = 1, datetime = new Date() } = options;

        switch (pricingConfig.type) {
            case PRICING_TYPES.STATIC:
                return this.calculateStaticPrice(pricingConfig, quantity);

            case PRICING_TYPES.TIERED:
                return this.calculateTieredPrice(pricingConfig, quantity);

            case PRICING_TYPES.COMPLIMENTARY:
                return this.calculateComplimentaryPrice();

            case PRICING_TYPES.DISCOUNTED:
                return this.calculateDiscountedPrice(pricingConfig, quantity);

            case PRICING_TYPES.DYNAMIC:
                return this.calculateDynamicPrice(pricingConfig, quantity, datetime);

            default:
                throw new Error(`Unknown pricing type: ${pricingConfig.type}`);
        }
    }

    /**
     * Calculate static (fixed) price
     */
    static calculateStaticPrice(pricingConfig, quantity) {
        const basePrice = pricingConfig.base_price || 0;
        const totalPrice = basePrice * quantity;

        return {
            pricing_type: PRICING_TYPES.STATIC,
            pricing_rule_applied: 'Fixed Price',
            unit_price: basePrice,
            quantity,
            base_price: totalPrice,
            discount_amount: 0,
            calculated_price: totalPrice
        };
    }

    /**
     * Calculate tiered price based on quantity
     */
    static calculateTieredPrice(pricingConfig, quantity) {
        const tiers = pricingConfig.tiers || [];

        // Sort tiers by min_quantity
        const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);

        // Find applicable tier
        let applicableTier = null;
        let tierName = 'Default';

        for (const tier of sortedTiers) {
            if (quantity >= tier.min_quantity && quantity <= tier.max_quantity) {
                applicableTier = tier;
                tierName = `Tier ${tier.min_quantity}-${tier.max_quantity}`;
                break;
            }
        }

        // If no tier matches, use default price or last tier
        if (!applicableTier) {
            applicableTier = sortedTiers[sortedTiers.length - 1] || { price: pricingConfig.default_price || 0 };
            tierName = 'Default/Overflow';
        }

        const unitPrice = applicableTier.price;
        const totalPrice = unitPrice * quantity;

        return {
            pricing_type: PRICING_TYPES.TIERED,
            pricing_rule_applied: tierName,
            tier_details: applicableTier,
            unit_price: unitPrice,
            quantity,
            base_price: totalPrice,
            discount_amount: 0,
            calculated_price: totalPrice
        };
    }

    /**
     * Calculate complimentary (free) price
     */
    static calculateComplimentaryPrice() {
        return {
            pricing_type: PRICING_TYPES.COMPLIMENTARY,
            pricing_rule_applied: 'Complimentary',
            unit_price: 0,
            quantity: 1,
            base_price: 0,
            discount_amount: 0,
            calculated_price: 0
        };
    }

    /**
     * Calculate discounted price
     */
    static calculateDiscountedPrice(pricingConfig, quantity) {
        const basePrice = pricingConfig.base_price || 0;
        const totalBase = basePrice * quantity;

        let discountAmount = 0;
        let discountDescription = 'No discount';

        if (pricingConfig.discount && pricingConfig.discount.type) {
            const discountValue = pricingConfig.discount.value || 0;

            if (pricingConfig.discount.type === DISCOUNT_TYPES.FLAT) {
                discountAmount = discountValue;
                discountDescription = `Flat discount: ${discountValue}`;
            } else if (pricingConfig.discount.type === DISCOUNT_TYPES.PERCENTAGE) {
                discountAmount = (totalBase * discountValue) / 100;
                discountDescription = `${discountValue}% off`;
            }
        }

        // Ensure discount doesn't exceed base price
        discountAmount = Math.min(discountAmount, totalBase);
        const finalPrice = totalBase - discountAmount;

        return {
            pricing_type: PRICING_TYPES.DISCOUNTED,
            pricing_rule_applied: discountDescription,
            discount_details: pricingConfig.discount,
            unit_price: basePrice,
            quantity,
            base_price: totalBase,
            discount_amount: discountAmount,
            calculated_price: finalPrice
        };
    }

    /**
     * Calculate dynamic (time-based) price
     */
    static calculateDynamicPrice(pricingConfig, quantity, datetime) {
        const date = new Date(datetime);
        const dayOfWeek = date.getDay();
        const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        const rules = pricingConfig.dynamic_rules || [];

        // Sort rules by priority (descending)
        const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Find applicable rule
        let applicableRule = null;

        for (const rule of sortedRules) {
            const isDayMatch = !rule.days || rule.days.length === 0 || rule.days.includes(dayOfWeek);
            const isTimeMatch = this.isTimeInRange(currentTime, rule.start_time, rule.end_time);

            if (isDayMatch && isTimeMatch) {
                applicableRule = rule;
                break;
            }
        }

        // Use applicable rule or default price
        const unitPrice = applicableRule ? applicableRule.price : (pricingConfig.default_price || 0);
        const ruleName = applicableRule ? applicableRule.name : 'Default Price';
        const totalPrice = unitPrice * quantity;

        return {
            pricing_type: PRICING_TYPES.DYNAMIC,
            pricing_rule_applied: ruleName,
            rule_details: applicableRule,
            current_day: dayOfWeek,
            current_time: currentTime,
            unit_price: unitPrice,
            quantity,
            base_price: totalPrice,
            discount_amount: 0,
            calculated_price: totalPrice
        };
    }

    /**
     * Check if time is within a range
     */
    static isTimeInRange(time, startTime, endTime) {
        const toMinutes = (t) => {
            const [hours, minutes] = t.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const current = toMinutes(time);
        const start = toMinutes(startTime);
        const end = toMinutes(endTime);

        // Handle overnight ranges (e.g., 22:00 to 02:00)
        if (end < start) {
            return current >= start || current < end;
        }

        return current >= start && current < end;
    }

    /**
     * Validate pricing configuration
     */
    static validatePricingConfig(pricingConfig) {
        const errors = [];

        if (!pricingConfig.type) {
            errors.push('Pricing type is required');
            return { valid: false, errors };
        }

        switch (pricingConfig.type) {
            case PRICING_TYPES.STATIC:
                if (pricingConfig.base_price === undefined || pricingConfig.base_price < 0) {
                    errors.push('Static pricing requires a valid base_price');
                }
                break;

            case PRICING_TYPES.TIERED:
                if (!pricingConfig.tiers || pricingConfig.tiers.length === 0) {
                    errors.push('Tiered pricing requires at least one tier');
                } else {
                    // Check for overlapping tiers
                    const tiers = [...pricingConfig.tiers].sort((a, b) => a.min_quantity - b.min_quantity);
                    for (let i = 0; i < tiers.length - 1; i++) {
                        if (tiers[i].max_quantity >= tiers[i + 1].min_quantity) {
                            errors.push(`Tier overlap detected between tier ${i + 1} and tier ${i + 2}`);
                        }
                    }
                }
                break;

            case PRICING_TYPES.DISCOUNTED:
                if (pricingConfig.base_price === undefined || pricingConfig.base_price < 0) {
                    errors.push('Discounted pricing requires a valid base_price');
                }
                if (!pricingConfig.discount || !pricingConfig.discount.type) {
                    errors.push('Discounted pricing requires discount configuration');
                }
                break;

            case PRICING_TYPES.DYNAMIC:
                if (!pricingConfig.dynamic_rules || pricingConfig.dynamic_rules.length === 0) {
                    errors.push('Dynamic pricing requires at least one rule');
                }
                if (pricingConfig.default_price === undefined) {
                    errors.push('Dynamic pricing requires a default_price');
                }
                break;

            case PRICING_TYPES.COMPLIMENTARY:
                // No additional validation needed
                break;

            default:
                errors.push(`Unknown pricing type: ${pricingConfig.type}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = PricingEngine;
