import supabase from "../config/supabaseClient.js";


/*
    Add Property To Wishlist
*/
export const addToWishlist = async (userId, propertyId) => {

    const { data, error } = await supabase
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
export const getWishlist = async (userId) => {

    const { data, error } = await supabase
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
export const alreadyExists = async (userId, propertyId) => {

    const { data, error } = await supabase
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
export const removeWishlist = async (wishlistId, userId) => {

    const { data, error } = await supabase
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
export const wishlistCount = async (propertyId) => {

    const { count, error } = await supabase
        .from("wishlists")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("property_id", propertyId);

    return { count, error };

};