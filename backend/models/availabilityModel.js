import supabase from "../config/supabaseClient.js";


/*
    Get All Unavailability Blocks For A Property (public — anyone can see
    which ranges the host has blocked off, same as booked ranges).
*/
export const getUnavailableRanges = async (propertyId, client = supabase) => {

    const { data, error } = await client
        .from("property_unavailability")
        .select("id, start_date, end_date, reason, created_at")
        .eq("property_id", propertyId)
        .order("start_date", { ascending: true });

    return { data, error };
};


/*
    Create A Host-managed Unavailability Block
*/
export const createUnavailableRange = async (blockData, client = supabase) => {

    const { data, error } = await client
        .from("property_unavailability")
        .insert([blockData])
        .select()
        .single();

    return { data, error };
};


/*
    Remove A Host-managed Unavailability Block (host can only remove
    their own property's block — this also makes those dates
    "available" again, satisfying the optional host-managed
    availability requirement).
*/
export const deleteUnavailableRange = async (blockId, hostId, client = supabase) => {

    const { data, error } = await client
        .from("property_unavailability")
        .delete()
        .eq("id", blockId)
        .eq("host_id", hostId)
        .select()
        .single();

    return { data, error };
};
