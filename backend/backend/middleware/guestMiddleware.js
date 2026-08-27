// Must run AFTER authMiddleware (needs req.user and req.supabase already set).
const guestMiddleware = async (req, res, next) => {
    try {
        const { data, error } = await req.supabase
            .from("profiles")
            .select("role")
            .eq("id", req.user.id)
            .single();
 
        if (error || !data) {
            return res.status(403).json({ message: "Profile not found." });
        }
 
        if (data.role !== "guest") {
            return res.status(403).json({ message: "This feature is only available to guest accounts." });
        }
 
        next();
    } catch (err) {
        res.status(500).json({ message: "Authorization check failed.", error: err.message });
    }
};
 
export default guestMiddleware;
