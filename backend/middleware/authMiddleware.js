import supabase, { createRequestClient } from "../config/supabaseClient.js";

const authMiddleware = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        /*
            Authorization header must exist
            and use Bearer token format
        */
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authorization token missing."
            });
        }

        /*
            Extract access token
        */
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Authorization token missing."
            });
        }

        /*
            Validate token with Supabase
        */
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data || !data.user) {
            return res.status(401).json({
                message: "Invalid or expired token."
            });
        }

        /*
            Make authenticated user and token available
            to protected routes
        */
        req.user = data.user;
        req.token = token;

        /*
            Create RLS-aware Supabase client.
            PostgreSQL will now see the real
            authenticated user's auth.uid().
        */
        req.supabase = createRequestClient(token);

        next();

    } catch (error) {

        console.error("Authentication middleware error:", error);

        return res.status(500).json({
            message: "Authentication failed.",
            error: error.message
        });
    }

};

export default authMiddleware;