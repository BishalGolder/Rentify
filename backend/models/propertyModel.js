import supabase from "../config/supabaseClient.js";

/*
    Create Property
*/
export const createProperty = async (propertyData) => {

    const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select()
        .single();

    return { data, error };
};


/*
    Get All Properties
*/
export const getAllProperties = async () => {

    const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

    return { data, error };
};


/*
    Get Property By ID
*/
export const getPropertyById = async (propertyId) => {

    const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

    return { data, error };
};


/*
    Get All Properties Of Logged-in Host
*/
export const getHostProperties = async (hostId) => {

    const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", hostId)
        .order("created_at", { ascending: false });

    return { data, error };
};


/*
    Update Property
*/
export const updateProperty = async (propertyId, hostId, updatedData) => {

    const { data, error } = await supabase
        .from("properties")
        .update(updatedData)
        .eq("id", propertyId)
        .eq("host_id", hostId)
        .select()
        .single();

    return { data, error };
};


/*
    Delete Property
*/
export const deleteProperty = async (propertyId, hostId) => {

    const { data, error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId)
        .eq("host_id", hostId)
        .select()
        .single();

    return { data, error };
};