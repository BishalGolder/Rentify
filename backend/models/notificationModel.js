import supabase from "../config/supabaseClient.js";

export const createNotification = async (notificationData, client = supabase) => {
    const { data, error } = await client.rpc("create_notification", {
        p_user_id: notificationData.user_id,
        p_type: notificationData.type,
        p_title: notificationData.title,
        p_message: notificationData.message,
        p_related_entity_type: notificationData.related_entity_type || null,
        p_related_entity_id: notificationData.related_entity_id || null
    });
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

export const markAllAsRead = async (userId, client = supabase) => {
    const { data, error } = await client
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .select();
    return { data, error };
};
