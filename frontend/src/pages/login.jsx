import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Login() {
    const navigate = useNavigate();
    const [role, setRole] = useState("user");
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/api/auth/login", { // Replace port if different
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    role: role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            // Save the session token and user info (e.g., in localStorage)
            localStorage.setItem("token", data.session.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("Login Successful!");
            navigate("/dashboard"); // Redirect to home/dashboard

        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Rentify</h1>
                <h2>Welcome Back</h2>
                <p className="subtitle">Login to continue</p>

                <div className="role-container">
                    <div
                        className={role === "user" ? "role-card active" : "role-card"}
                        onClick={() => setRole("user")}
                    >
                        <h3>Guest</h3>
                        <p>Book Properties</p>
                    </div>

                    <div
                        className={role === "host" ? "role-card active" : "role-card"}
                        onClick={() => setRole("host")}
                    >
                        <h3>Host</h3>
                        <p>Manage Properties</p>
                    </div>

                    <div className="role-card disabled">
                        <h3>Admin</h3>
                        <p>Coming Soon</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account?
                    <Link to="/signup">Create Account</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;