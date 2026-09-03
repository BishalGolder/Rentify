import supabase from "../config/supabaseClient.js";


/*
    Create Coupon
*/
export const createCoupon = async (couponData, client = supabase) => {

    const { data, error } = await client
        .from("coupons")
        .insert([couponData])
        .select()
        .single();

    return { data, error };

};


/*
    Get Coupon By Code (case-insensitive, only what's needed to validate it)
*/
export const getCouponByCode = async (code, client = supabase) => {

    const { data, error } = await client
        .from("coupons")
        .select("*")
        .ilike("code", code)
        .maybeSingle();

    return { data, error };

};


/*
    Get Coupon By Id
*/
export const getCouponById = async (couponId, client = supabase) => {

    const { data, error } = await client
        .from("coupons")
        .select("*")
        .eq("id", couponId)
        .maybeSingle();

    return { data, error };

};


/*
    Get All Coupons Created By A Host
*/
export const getCouponsByCreator = async (creatorId, client = supabase) => {

    const { data, error } = await client
        .from("coupons")
        .select(`
            *,
            properties ( id, title )
        `)
        .eq("created_by", creatorId)
        .order("created_at", { ascending: false });

    return { data, error };

};


/*
    Get All Coupons (Admin — expects a service-role client to bypass RLS)
*/
export const getAllCoupons = async (client) => {

    const { data, error } = await client
        .from("coupons")
        .select(`
            *,
            properties ( id, title ),
            profiles!coupons_created_by_fkey ( id, full_name, role )
        `)
        .order("created_at", { ascending: false });

    return { data, error };

};


/*
    Update Coupon (only its creator may update it)
*/
export const updateCoupon = async (couponId, creatorId, updates, client = supabase) => {

    const { data, error } = await client
        .from("coupons")
        .update(updates)
        .eq("id", couponId)
        .eq("created_by", creatorId)
        .select()
        .single();

    return { data, error };

};


/*
    Update Coupon As Admin (bypasses the "own coupon" restriction —
    expects a service-role client)
*/
export const adminUpdateCoupon = async (couponId, updates, client) => {

    const { data, error } = await client
        .from("coupons")
        .update(updates)
        .eq("id", couponId)
        .select()
        .single();

    return { data, error };

};


/*
    Delete Coupon (only its creator may delete it)
*/
export const deleteCoupon = async (couponId, creatorId, client = supabase) => {

    const { data, error } = await client
        .from("coupons")
        .delete()
        .eq("id", couponId)
        .eq("created_by", creatorId)
        .select()
        .single();

    return { data, error };

};


/*
    Delete Coupon As Admin (expects a service-role client)
*/
export const adminDeleteCoupon = async (couponId, client) => {

    const { data, error } = await client
        .from("coupons")
        .delete()
        .eq("id", couponId)
        .select()
        .single();

    return { data, error };

};


/*
    Count How Many Times A Specific User Has Already Redeemed A Coupon
*/
export const countUserRedemptions = async (couponId, userId, client = supabase) => {

    const { count, error } = await client
        .from("coupon_usages")
        .select("*", { count: "exact", head: true })
        .eq("coupon_id", couponId)
        .eq("user_id", userId);

    return { count, error };

};


/*
    Atomically Redeem A Coupon
    (bumps times_used + records the usage row via a single RPC
    so concurrent requests can't both slip past usage_limit)
*/
export const redeemCoupon = async (couponId, userId, bookingId, discountAmount, client = supabase) => {

    const { data, error } = await client.rpc("redeem_coupon", {
        p_coupon_id: couponId,
        p_user_id: userId,
        p_booking_id: bookingId,
        p_discount_amount: discountAmount
    });

    return { data, error };

};
