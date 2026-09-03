// Must run AFTER authMiddleware (needs req.user and req.supabase already set).
// Allows a request through if the logged-in profile is either a "host" or an "admin".
const hostOrAdminMiddleware = async (req, res, next) => {
    try {
        const { data, error } = await req.supabase
            .from("profiles")
            .select("role")
            .eq("id", req.user.id)
            .single();

        if (error || !data) {
            return res.status(403).json({ message: "Profile not found." });
        }

        if (data.role !== "host" && data.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Host or admin account required."
            });
        }

        req.profile = data;

        next();
    } catch (err) {
        res.status(500).json({ message: "Authorization check failed.", error: err.message });
    }
};

export default hostOrAdminMiddleware;
