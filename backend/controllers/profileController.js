import * as ProfileModel from "../models/profileModel.js";

/*
    Create Profile
*/
export const createProfile = async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            full_name,
            phone,
            avatar_url,
            role
        } = req.body;

        const profileData = {
            id: userId,
            full_name,
            phone,
            avatar_url,
            role
        };

        const { data, error } =
            await ProfileModel.createProfile(profileData, req.supabase);

        if (error) {
            return res.status(400).json(error);
        }

        res.status(201).json({
            message: "Profile created successfully.",
            profile: data
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};


/*
    Get Logged-in User Profile
*/
export const getMyProfile = async (req, res) => {

    const userId = req.user.id;

    const { data, error } =
        await ProfileModel.getProfile(userId, req.supabase);

    if (error) {
        return res.status(404).json({
            message: "Profile not found."
        });
    }

    res.json(data);

};


/*
    Update Profile
*/
export const updateProfile = async (req, res) => {

    const userId = req.user.id;

    // Role can only be changed via the admin-only /:id/role route (Problem C.3)
    const { role, ...safeUpdates } = req.body;

    const { data, error } =
        await ProfileModel.updateProfile(
            userId,
            safeUpdates,
            req.supabase
        );

    if (error) {
        return res.status(400).json(error);
    }

    res.json({
        message: "Profile updated successfully.",
        profile: data
    });

};


/*
    Delete Profile
*/
export const deleteProfile = async (req, res) => {

    const userId = req.user.id;

    const { data, error } =
        await ProfileModel.deleteProfile(userId, req.supabase);

    if (error) {
        return res.status(400).json(error);
    }

    res.json({
        message: "Profile deleted successfully.",
        profile: data
    });

};


/*
    Change User Role
*/
export const changeRole = async (req, res) => {

    const { id } = req.params;

    const { role } = req.body;

    const { data, error } =
        await ProfileModel.changeRole(id, role, req.supabase);

    if (error) {
        return res.status(400).json(error);
    }

    res.json({
        message: "Role updated successfully.",
        profile: data
    });

};
/*
    Get All Users For Admin
*/
export const getAllUsers = async (req, res) => {

    try {

        const { serviceSupabase } =
            await import("../config/supabaseClient.js");

        if (!serviceSupabase) {
            return res.status(500).json({
                message:
                    "Server admin database client is not configured."
            });
        }

        const { data, error } =
            await ProfileModel.getAllUsers(
                serviceSupabase
            );

        if (error) {
            return res.status(400).json({
                message:
                    "Failed to load users.",
                error: error.message
            });
        }

        return res.json(data || []);

    } catch (error) {

        console.error(
            "Get All Users Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to load users."
        });
    }
};