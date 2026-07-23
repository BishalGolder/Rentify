import supabase from "../config/supabaseClient.js";

/*
    Create Profile
*/
export const createProfile = async (profileData) => {

    const { data, error } = await supabase
        .from("profiles")
        .insert([profileData])
        .select()
        .single();

    return { data, error };
};


/*
    Get Profile By ID
*/
export const getProfile = async (userId) => {

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    return { data, error };
};


/*
    Update Profile
*/
export const updateProfile = async (userId, updatedData) => {

    const { data, error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("id", userId)
        .select()
        .single();

    return { data, error };
};


/*
    Delete Profile
*/
export const deleteProfile = async (userId) => {

    const { data, error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId)
        .select()
        .single();

    return { data, error };
};


/*
    Change User Role
*/
export const changeRole = async (userId, role) => {

    const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId)
        .select()
        .single();

    return { data, error };
};