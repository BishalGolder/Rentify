import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is missing from .env");
}

if (!SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY is missing from .env");
}

// Public / anonymous client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Logged-in user client
export const createRequestClient = (accessToken) => {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
};

// Trusted server-side admin client
export const serviceSupabase = SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: {
              autoRefreshToken: false,
              persistSession: false,
              detectSessionInUrl: false
          }
      })
    : null;

export default supabase;