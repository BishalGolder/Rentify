import supabase from "../config/supabaseClient.js";

export const registerUser = async (req, res) => {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role, // "guest" or "host" only — admins are never created via signup
                }
            }
        });

        if (error) throw error;

        res.status(201).json({
            message: "Registration successful! Please check your email for a verification link.",
            user: data.user
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // profiles.role is the source of truth (supports admin; user_metadata does not).
        // Fall back to user_metadata only if the profile row hasn't been created yet.
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

        const actualRole = profile?.role || data.user?.user_metadata?.role;

        if (actualRole !== role) {
            return res.status(403).json({
                error: `Access Denied. This account is registered as ${actualRole}, not ${role}.`
            });
        }

        res.status(200).json({
            message: "Login successful",
            session: data.session,
            user: data.user,
            role: actualRole
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
