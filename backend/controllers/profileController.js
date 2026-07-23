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
            await ProfileModel.createProfile(profileData);

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
        await ProfileModel.getProfile(userId);

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

    const { data, error } =
        await ProfileModel.updateProfile(
            userId,
            req.body
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
        await ProfileModel.deleteProfile(userId);

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
        await ProfileModel.changeRole(id, role);

    if (error) {
        return res.status(400).json(error);
    }

    res.json({
        message: "Role updated successfully.",
        profile: data
    });

};