import * as WishlistModel from "../models/wishlistModel.js";

/*
    Add Property To Wishlist
*/
export const addToWishlist = async (req, res) => {

    const userId = req.user.id;
    const { property_id } = req.body;

    if (!property_id) {
        return res.status(400).json({ message: "property_id is required." });
    }

    const { data: existing } = await WishlistModel.alreadyExists(userId, property_id, req.supabase);

    if (existing) {
        return res.status(200).json({ message: "Already in wishlist.", wishlist: existing });
    }

    const { data, error } = await WishlistModel.addToWishlist(userId, property_id, req.supabase);

    if (error) {
        // Unique constraint (Section B.4) — handles a race between the
        // exists-check above and a near-simultaneous duplicate request.
        if (error.code === "23505") {
            return res.status(200).json({ message: "Already in wishlist." });
        }
        return res.status(400).json(error);
    }

    res.status(201).json({ message: "Added to wishlist.", wishlist: data });

};


/*
    Get Logged-in User's Wishlist
*/
export const getWishlist = async (req, res) => {

    const { data, error } = await WishlistModel.getWishlist(req.user.id, req.supabase);

    if (error) {
        return res.status(400).json(error);
    }

    res.json(data);

};


/*
    Remove Property From Wishlist
*/
export const removeFromWishlist = async (req, res) => {

    const { id } = req.params; // wishlist row id
    const { data, error } = await WishlistModel.removeWishlist(id, req.user.id, req.supabase);

    if (error) {
        return res.status(400).json(error);
    }

    res.json({ message: "Removed from wishlist.", wishlist: data });

};


/*
    Check If A Specific Property Is Wishlisted
*/
export const checkWishlist = async (req, res) => {

    const { propertyId } = req.params;
    const { data, error } = await WishlistModel.alreadyExists(req.user.id, propertyId, req.supabase);

    if (error) {
        return res.status(400).json(error);
    }

    res.json({ inWishlist: !!data, wishlistId: data?.id || null });

};
