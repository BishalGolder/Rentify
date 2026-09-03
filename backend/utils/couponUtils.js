/*
=====================================================
COUPON EVALUATION HELPER
=====================================================

Shared by the "validate coupon" endpoint and the
booking creation flow so both apply the exact same
rules and can never disagree with each other.
=====================================================
*/

export const evaluateCoupon = ({ coupon, amount, propertyId, redemptionCount }) => {

    if (!coupon) {
        return { valid: false, message: "Invalid coupon code." };
    }

    if (!coupon.is_active) {
        return { valid: false, message: "This coupon is no longer active." };
    }

    const now = new Date();

    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return { valid: false, message: "This coupon is not active yet." };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { valid: false, message: "This coupon has expired." };
    }

    if (coupon.property_id && String(coupon.property_id) !== String(propertyId)) {
        return { valid: false, message: "This coupon isn't valid for this property." };
    }

    if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.times_used >= coupon.usage_limit) {
        return { valid: false, message: "This coupon has reached its usage limit." };
    }

    if (coupon.per_user_limit && redemptionCount >= coupon.per_user_limit) {
        return { valid: false, message: "You've already used this coupon the maximum number of times." };
    }

    const numericAmount = Number(amount);

    if (coupon.min_booking_amount && numericAmount < Number(coupon.min_booking_amount)) {
        return {
            valid: false,
            message: `This coupon requires a minimum booking amount of ৳${coupon.min_booking_amount}.`
        };
    }

    let discountAmount = 0;

    if (coupon.discount_type === "percentage") {

        discountAmount = (numericAmount * Number(coupon.discount_value)) / 100;

        if (coupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
        }

    } else {

        discountAmount = Number(coupon.discount_value);

    }

    // Never let a coupon make a booking free/negative, and round to 2dp.
    discountAmount = Math.round(Math.min(discountAmount, numericAmount) * 100) / 100;

    if (discountAmount <= 0) {
        return { valid: false, message: "This coupon does not apply any discount to this booking." };
    }

    return {
        valid: true,
        discountAmount,
        finalAmount: Math.round((numericAmount - discountAmount) * 100) / 100
    };

};
