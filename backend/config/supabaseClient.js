import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Anonymous client — only safe for reads that DON'T depend on auth.uid()
// (e.g. public verified-property listing/search). Never use this for
// inserts/updates/deletes that RLS scopes to a specific user.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Per-request client — forwards the caller's own access token so
// Postgres sees the real auth.uid() and RLS is evaluated as that user.
// Create a fresh one per request; never cache/reuse across users.
export const createRequestClient = (accessToken) => {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
};

export default supabase;
