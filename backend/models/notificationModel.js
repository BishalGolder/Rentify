import supabase from "../config/supabaseClient.js";

export const createNotification = async (notificationData, client = supabase) => {
    const { data, error } = await client
        .from("notifications")
        .insert([notificationData])
        .select()
        .single();
    return { data, error };
};

export const getMyNotifications = async (userId, client = supabase) => {
    const { data, error } = await client
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
    return { data, error };
};

export const markAsRead = async (notificationId, userId, client = supabase) => {
    const { data, error } = await client
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId)
        .select()
        .single();
    return { data, error };
};
