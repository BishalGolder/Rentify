import * as CouponModel from "../models/couponModel.js";
import * as PropertyModel from "../models/propertyModel.js";
import { evaluateCoupon } from "../utils/couponUtils.js";


const DISCOUNT_TYPES = ["percentage", "fixed"];


/*
=====================================================
CREATE COUPON (host or admin)
=====================================================
*/

export const createCoupon = async (req, res) => {

    try {

        const userId = req.user.id;
        const role = req.profile.role; // "host" or "admin", set by hostOrAdminMiddleware

        let {
            code,
            description,
            discount_type,
            discount_value,
            max_discount_amount,
            min_booking_amount,
            usage_limit,
            per_user_limit,
            property_id,
            valid_from,
            valid_until
        } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: "A coupon code is required." });
        }

        if (!DISCOUNT_TYPES.includes(discount_type)) {
            return res.status(400).json({ message: "discount_type must be 'percentage' or 'fixed'." });
        }

        const numericValue = Number(discount_value);

        if (!Number.isFinite(numericValue) || numericValue <= 0) {
            return res.status(400).json({ message: "discount_value must be a positive number." });
        }

        if (discount_type === "percentage" && numericValue > 100) {
            return res.status(400).json({ message: "A percentage discount can't exceed 100." });
        }

        /*
            A host may only scope a coupon to one of their own properties
            (or leave it unscoped, which admins can also do platform-wide).
            Admins may scope to any property.
        */
        if (property_id) {

            const { data: property, error: propertyError } =
                await PropertyModel.getPropertyById(property_id, req.supabase);

            if (propertyError || !property) {
                return res.status(404).json({ message: "Property not found." });
            }

            if (role === "host" && property.host_id !== userId) {
                return res.status(403).json({ message: "You can only create coupons for your own properties." });
            }

        } else if (role === "host") {

            return res.status(400).json({
                message: "Hosts must scope a coupon to one of their own properties."
            });

        }

        const couponData = {
            code: code.trim().toUpperCase(),
            description: description?.trim() || null,
            discount_type,
            discount_value: numericValue,
            max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
            min_booking_amount: min_booking_amount ? Number(min_booking_amount) : 0,
            usage_limit: usage_limit ? Number(usage_limit) : null,
            per_user_limit: per_user_limit ? Number(per_user_limit) : 1,
            property_id: property_id || null,
            created_by: userId,
            created_by_role: role,
            valid_from: valid_from || new Date().toISOString(),
            valid_until: valid_until || null
        };

        const { data, error } = await CouponModel.createCoupon(couponData, req.supabase);

        if (error) {

            if (error.code === "23505") {
                return res.status(409).json({ message: "A coupon with this code already exists." });
            }

            return res.status(400).json({ message: error.message });

        }

        return res.status(201).json({ message: "Coupon created.", coupon: data });

    } catch (error) {

        console.error("Create Coupon Error:", error);
        return res.status(500).json({ message: "Failed to create coupon." });

    }

};


/*
=====================================================
GET MY COUPONS (host or admin — coupons they created)
=====================================================
*/

export const getMyCoupons = async (req, res) => {

    try {

        const { data, error } = await CouponModel.getCouponsByCreator(req.user.id, req.supabase);

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.json(data || []);

    } catch (error) {

        console.error("Get My Coupons Error:", error);
        return res.status(500).json({ message: "Failed to load coupons." });

    }

};


/*
=====================================================
GET ALL COUPONS (admin — platform-wide, service-role)
=====================================================
*/

export const getAllCouponsForAdmin = async (req, res) => {

    try {

        const { serviceSupabase } = await import("../config/supabaseClient.js");

        if (!serviceSupabase) {
            return res.status(500).json({ message: "Server admin database client is not configured." });
        }

        const { data, error } = await CouponModel.getAllCoupons(serviceSupabase);

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.json(data || []);

    } catch (error) {

        console.error("Get All Coupons Error:", error);
        return res.status(500).json({ message: "Failed to load coupons." });

    }

};


/*
=====================================================
UPDATE COUPON (owner, or admin for any coupon)
=====================================================
*/

export const updateCoupon = async (req, res) => {

    try {

        const { id } = req.params;
        const role = req.profile.role;

        const allowedFields = [
            "description", "discount_type", "discount_value", "max_discount_amount",
            "min_booking_amount", "usage_limit", "per_user_limit", "valid_from",
            "valid_until", "is_active"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided to update." });
        }

        if (updates.discount_type && !DISCOUNT_TYPES.includes(updates.discount_type)) {
            return res.status(400).json({ message: "discount_type must be 'percentage' or 'fixed'." });
        }

        let result;

        if (role === "admin") {

            const { serviceSupabase } = await import("../config/supabaseClient.js");

            result = await CouponModel.adminUpdateCoupon(id, updates, serviceSupabase);

        } else {

            result = await CouponModel.updateCoupon(id, req.user.id, updates, req.supabase);

        }

        if (result.error) {
            return res.status(400).json({ message: result.error.message });
        }

        if (!result.data) {
            return res.status(404).json({ message: "Coupon not found." });
        }

        return res.json({ message: "Coupon updated.", coupon: result.data });

    } catch (error) {

        console.error("Update Coupon Error:", error);
        return res.status(500).json({ message: "Failed to update coupon." });

    }

};


/*
=====================================================
DELETE COUPON (owner, or admin for any coupon)
=====================================================
*/

export const deleteCoupon = async (req, res) => {

    try {

        const { id } = req.params;
        const role = req.profile.role;

        let result;

        if (role === "admin") {

            const { serviceSupabase } = await import("../config/supabaseClient.js");

            result = await CouponModel.adminDeleteCoupon(id, serviceSupabase);

        } else {

            result = await CouponModel.deleteCoupon(id, req.user.id, req.supabase);

        }

        if (result.error) {
            return res.status(400).json({ message: result.error.message });
        }

        if (!result.data) {
            return res.status(404).json({ message: "Coupon not found." });
        }

        return res.json({ message: "Coupon deleted.", coupon: result.data });

    } catch (error) {

        console.error("Delete Coupon Error:", error);
        return res.status(500).json({ message: "Failed to delete coupon." });

    }

};


/*
=====================================================
VALIDATE / PREVIEW A COUPON (guest, before booking)
=====================================================
*/

export const validateCoupon = async (req, res) => {

    try {

        const userId = req.user.id;

        const { code, property_id, amount } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: "A coupon code is required." });
        }

        if (!property_id) {
            return res.status(400).json({ message: "property_id is required." });
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: "A valid booking amount is required." });
        }

        const { data: coupon, error: couponError } = await CouponModel.getCouponByCode(code.trim(), req.supabase);

        if (couponError) {
            return res.status(400).json({ message: couponError.message });
        }

        if (!coupon) {
            return res.status(404).json({ valid: false, message: "Invalid coupon code." });
        }

        const { count: redemptionCount, error: countError } =
            await CouponModel.countUserRedemptions(coupon.id, userId, req.supabase);

        if (countError) {
            return res.status(400).json({ message: countError.message });
        }

        const result = evaluateCoupon({
            coupon,
            amount: numericAmount,
            propertyId: property_id,
            redemptionCount: redemptionCount || 0
        });

        if (!result.valid) {
            return res.status(400).json({ valid: false, message: result.message });
        }

        return res.json({
            valid: true,
            coupon_id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: result.discountAmount,
            final_amount: result.finalAmount
        });

    } catch (error) {

        console.error("Validate Coupon Error:", error);
        return res.status(500).json({ message: "Failed to validate coupon." });

    }

};
