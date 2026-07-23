import supabase from "../config/supabaseClient.js"; // Adjust relative path if needed

export const registerUser = async (req, res) => {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Sign up user via Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role, // "user" (Guest) or "host"
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

        // Retrieve the role we saved in user metadata during signup
        const userRole = data.user?.user_metadata?.role;

        // Ensure the screen role matches what they registered as
        if (userRole !== role) {
            return res.status(403).json({ 
                error: `Access Denied. You registered as a ${userRole}, but you are trying to log in as a ${role}.` 
            });
        }

        // Send session token and user info back to React
        res.status(200).json({
            message: "Login successful",
            session: data.session, // Contains access_token
            user: data.user
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};