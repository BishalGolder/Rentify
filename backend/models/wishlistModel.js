import supabase from "../config/supabaseClient.js";


/*
    Add Property To Wishlist
*/
export const addToWishlist = async (userId, propertyId, client = supabase) => {

    const { data, error } = await client
        .from("wishlists")
        .insert([
            {
                user_id: userId,
                property_id: propertyId
            }
        ])
        .select()
        .single();

    return { data, error };

};



/*
    Get Logged-in User Wishlist
*/
export const getWishlist = async (userId, client = supabase) => {

    const { data, error } = await client
        .from("wishlists")
        .select(`
            id,
            created_at,
            properties(
                id,
                title,
                description,
                location,
                property_type,
                price,
                amenities,
                image_urls
            )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    return { data, error };

};



/*
    Check Whether Property Already Exists
*/
export const alreadyExists = async (userId, propertyId, client = supabase) => {

    const { data, error } = await client
        .from("wishlists")
        .select("*")
        .eq("user_id", userId)
        .eq("property_id", propertyId)
        .maybeSingle();

    return { data, error };

};



/*
    Remove Property From Wishlist
*/
export const removeWishlist = async (wishlistId, userId, client = supabase) => {

    const { data, error } = await client
        .from("wishlists")
        .delete()
        .eq("id", wishlistId)
        .eq("user_id", userId)
        .select()
        .single();

    return { data, error };

};



/*
    Total Wishlist Count
*/
export const wishlistCount = async (propertyId, client = supabase) => {

    const { count, error } = await client
        .from("wishlists")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("property_id", propertyId);

    return { count, error };

};