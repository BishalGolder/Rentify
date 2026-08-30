const adminPropertyMiddleware = async (req, res, next) => {
    try {
        const { data, error } = await req.supabase
            .from("profiles")
            .select("role")
            .eq("id", req.user.id)
            .single();
 
        if (error || !data || data.role !== "admin") {
            return res.status(403).json({ message: "Admin access required." });
        }
 
        next();
    } catch (err) {
        res.status(500).json({ message: "Authorization check failed." });
    }
};
 
export default adminPropertyMiddleware;
