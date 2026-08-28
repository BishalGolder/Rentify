import supabase from "../config/supabaseClient.js";

/*
    Create Profile
*/
export const createProfile = async (profileData, client = supabase) => {
    const { data, error } = await client
        .from("profiles")
        .insert([profileData])
        .select()
        .single();

    return { data, error };
};


/*
    Get Profile By ID
*/
export const getProfile = async (userId, client = supabase) => {
    const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    return { data, error };
};


/*
    Update Profile
*/
export const updateProfile = async (userId, updatedData, client = supabase) => {
    const { data, error } = await client
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
export const deleteProfile = async (userId, client = supabase) => {
    const { data, error } = await client
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
export const changeRole = async (userId, role, client = supabase) => {
    const { data, error } = await client
        .from("profiles")
        .update({ role })
        .eq("id", userId)
        .select()
        .single();

    return { data, error };
};
/*
    Get All Users For Admin
*/
export const getAllUsers = async (client) => {

    const { data, error } = await client
        .from("profiles")
        .select(`
            id,
            full_name,
            phone,
            avatar_url,
            role
        `)
        .order("full_name", { ascending: true });

    return { data, error };
};