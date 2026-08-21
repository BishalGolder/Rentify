import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;


/*
    Check required environment variables
*/
if (!SUPABASE_URL) {
    throw new Error(
        "SUPABASE_URL is missing from .env"
    );
}

if (!SUPABASE_ANON_KEY) {
    throw new Error(
        "SUPABASE_ANON_KEY is missing from .env"
    );
}


/*
    -------------------------------------------------
    Anonymous Supabase Client
    -------------------------------------------------

    Used for public operations such as:
    - viewing properties
    - viewing public reviews

    Does NOT act as a logged-in user.
*/
const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/*
    -------------------------------------------------
    Authenticated Request Client
    -------------------------------------------------

    Used inside authMiddleware.

    The logged-in user's access token is forwarded
    to Supabase so RLS sees the real auth.uid().
*/
export const createRequestClient = (accessToken) => {

    return createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        }
    );
};


/*
    -------------------------------------------------
    Server-only Service Role Client
    -------------------------------------------------

    Used ONLY by trusted backend code.

    This bypasses RLS, so never expose this client
    or the service-role key to the frontend.
*/
export const serviceSupabase =
    SUPABASE_SERVICE_ROLE_KEY
        ? createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
        : null;


export default supabase;