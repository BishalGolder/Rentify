import supabase from "../config/supabaseClient.js";

const authMiddleware = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization header missing"
            });
        }

        const token = authHeader.replace("Bearer ", "");

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        req.user = data.user;

        next();

    } catch (err) {

        return res.status(500).json({
            message: "Authentication failed",
            error: err.message
        });

    }

};

export default authMiddleware;