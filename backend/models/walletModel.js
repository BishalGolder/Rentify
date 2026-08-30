import supabase from "../config/supabaseClient.js";
 
export const createRechargeRequest = async (userId, amount, client = supabase) => {
    const { data, error } = await client
        .from("wallet_recharge_requests")
        .insert([{ user_id: userId, amount }])
        .select()
        .single();
    return { data, error };
};
 
export const getMyRechargeRequests = async (userId, client = supabase) => {
    const { data, error } = await client
        .from("wallet_recharge_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    return { data, error };
};
 
export const getMyTransactions = async (userId, client = supabase) => {
    const { data, error } = await client
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
    return { data, error };
};
 
export const getAllPendingRequests = async () => {
    const { serviceSupabase } = await import("../config/supabaseClient.js");
 
    if (!serviceSupabase) {
        return { data: null, error: { message: "Service client not configured." } };
    }
 
    const { data, error } = await serviceSupabase
        .from("wallet_recharge_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
 
    if (error || !data) return { data, error };
 
    const userIds = [...new Set(data.map((r) => r.user_id))];
 
    const { data: profiles } = await serviceSupabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
 
    const profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.id, p])
    );
 
    const enriched = data.map((r) => ({
        ...r,
        profiles: profileMap[r.user_id] || null
    }));
 
    return { data: enriched, error: null };
};

