import supabase from "../config/supabaseClient.js";
 
/*
    Create Property
*/
export const createProperty = async (propertyData, client = supabase) => {
 
    const { data, error } = await client
        .from("properties")
        .insert([propertyData])
        .select()
        .single();
 
    return { data, error };
};
 
 
/*
    Get All Properties (public — only verified)
*/
export const getAllProperties = async (client = supabase) => {
 
    const { data, error } = await client
        .from("properties")
        .select("*")
        .eq("verification_status", "verified")
        .order("created_at", { ascending: false });
 
    return { data, error };
};
 
 
/*
    Get Property By ID
*/
export const getPropertyById = async (propertyId, client = supabase) => {
 
    const { data, error } = await client
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();
 
    return { data, error };
};
 
 
/*
    Get All Properties Of Logged-in Host
*/
export const getHostProperties = async (hostId, client = supabase) => {
 
    const { data, error } = await client
        .from("properties")
        .select("*")
        .eq("host_id", hostId)
        .order("created_at", { ascending: false });
 
    return { data, error };
};
 
 
/*
    Update Property
*/
export const updateProperty = async (propertyId, hostId, updatedData, client = supabase) => {
 
    const { data, error } = await client
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
export const deleteProperty = async (propertyId, hostId, client = supabase) => {
 
    const { data, error } = await client
        .from("properties")
        .delete()
        .eq("id", propertyId)
        .eq("host_id", hostId)
        .select()
        .single();
 
    return { data, error };
};
 
 
/*
    Get All Pending-Verification Properties (Admin)
*/
export const getPendingProperties = async (client = supabase) => {
 
    const { data, error } = await client
        .from("properties")
        .select("*")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: true });
 
    return { data, error };
};
 
 
/*
    Approve or Reject a Property (Admin)
*/
export const setVerificationStatus = async (propertyId, status, rejectionReason, client = supabase) => {
 
    const { data, error } = await client
        .from("properties")
        .update({
            verification_status: status,
            is_verified: status === "verified",
            rejection_reason: rejectionReason
        })
        .eq("id", propertyId)
        .eq("verification_status", "pending") // only a pending property can be transitioned
        .select()
        .single();
 
    return { data, error };
};



export const cancelPendingProperty = async (propertyId, hostId, client = supabase) => {

    const {data, error } = await client
        .from("properties")
        .delete()
        .eq("id", propertyId)
        .eq("host_id", hostId)
        .eq("verification_status", "pending")
        .select()
        .single();

    return {data, error};
};
