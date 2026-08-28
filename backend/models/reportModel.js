import supabase from "../config/supabaseClient.js";


/*
    Create Report
*/
export const createReport = async (
    reportData,
    client = supabase
) => {

    const { data, error } = await client
        .from("reports")
        .insert([reportData])
        .select()
        .single();

    return { data, error };
};


/*
    Get Reports Created By Logged-in User
*/
export const getMyReports = async (
    reporterId,
    client = supabase
) => {

    const { data, error } = await client
        .from("reports")
        .select(`
            id,
            property_id,
            category,
            description,
            status,
            admin_note,
            created_at,
            updated_at,
            properties (
                id,
                title,
                location,
                district
            )
        `)
        .eq("reporter_id", reporterId)
        .order("created_at", {
            ascending: false
        });

    return { data, error };
};


/*
    Get All Reports For Admin
*/
export const getAllReportsForAdmin = async (
    client
) => {

    const { data, error } = await client
        .from("reports")
        .select(`
            id,
            reporter_id,
            property_id,
            category,
            description,
            status,
            admin_note,
            created_at,
            updated_at,
            properties (
                id,
                title,
                location,
                district
            ),
            profiles (
                id,
                full_name,
                role
            )
        `)
        .order("created_at", {
            ascending: false
        });

    return { data, error };
};


/*
    Update Report Status / Admin Note
*/
export const updateReportByAdmin = async (
    reportId,
    updateData,
    client
) => {

    const { data, error } = await client
        .from("reports")
        .update({
            ...updateData,
            updated_at:
                new Date().toISOString()
        })
        .eq("id", reportId)
        .select()
        .single();

    return { data, error };
};