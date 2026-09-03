import supabase from "../config/supabaseClient.js";


/*
    Create Thread
*/
export const createThread = async (threadData, client = supabase) => {

    const { data, error } = await client
        .from("forum_threads")
        .insert([threadData])
        .select(`
            *,
            profiles ( id, full_name, role )
        `)
        .single();

    return { data, error };

};


/*
    Get All Threads (optionally filtered by category), newest / pinned first
*/
export const getThreads = async (category, client = supabase) => {

    let query = client
        .from("forum_threads")
        .select(`
            *,
            profiles ( id, full_name, role )
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

    if (category) {
        query = query.eq("category", category);
    }

    const { data, error } = await query;

    return { data, error };

};


/*
    Get A Single Thread By Id
*/
export const getThreadById = async (threadId, client = supabase) => {

    const { data, error } = await client
        .from("forum_threads")
        .select(`
            *,
            profiles ( id, full_name, role )
        `)
        .eq("id", threadId)
        .maybeSingle();

    return { data, error };

};


/*
    Get All Replies For A Thread, oldest first
*/
export const getRepliesForThread = async (threadId, client = supabase) => {

    const { data, error } = await client
        .from("forum_replies")
        .select(`
            *,
            profiles ( id, full_name, role )
        `)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

    return { data, error };

};


/*
    Add A Reply (atomic — also bumps forum_threads.reply_count via RPC)
*/
export const addReply = async (threadId, authorId, body, client = supabase) => {

    const { data, error } = await client.rpc("add_forum_reply", {
        p_thread_id: threadId,
        p_author_id: authorId,
        p_body: body
    });

    return { data, error };

};


/*
    Delete Thread (only its author may delete it)
*/
export const deleteThread = async (threadId, authorId, client = supabase) => {

    const { data, error } = await client
        .from("forum_threads")
        .delete()
        .eq("id", threadId)
        .eq("author_id", authorId)
        .select()
        .single();

    return { data, error };

};


/*
    Delete Thread As Admin (expects a service-role client)
*/
export const adminDeleteThread = async (threadId, client) => {

    const { data, error } = await client
        .from("forum_threads")
        .delete()
        .eq("id", threadId)
        .select()
        .single();

    return { data, error };

};


/*
    Delete Reply (only its author may delete it)
*/
export const deleteReply = async (replyId, authorId, client = supabase) => {

    const { data, error } = await client
        .from("forum_replies")
        .delete()
        .eq("id", replyId)
        .eq("author_id", authorId)
        .select()
        .single();

    return { data, error };

};


/*
    Delete Reply As Admin (expects a service-role client)
*/
export const adminDeleteReply = async (replyId, client) => {

    const { data, error } = await client
        .from("forum_replies")
        .delete()
        .eq("id", replyId)
        .select()
        .single();

    return { data, error };

};
