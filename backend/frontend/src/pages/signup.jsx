import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Signup() {
    const navigate = useNavigate();
    const [role, setRole] = useState("user");
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/api/auth/signup", { // Replace port if different
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            alert(data.message || "Account created successfully!");
            navigate("/login");

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
                <h2>Create Account</h2>
                <p className="subtitle">Choose your account type</p>

                <div className="role-container">
                    <div
                        className={role === "user" ? "role-card active" : "role-card"}
                        onClick={() => setRole("user")}
                    >
                        <h3>Guest</h3>
                        <p>Book properties</p>
                    </div>

                    <div
                        className={role === "host" ? "role-card active" : "role-card"}
                        onClick={() => setRole("host")}
                    >
                        <h3>Host</h3>
                        <p>List your properties</p>
                    </div>

                    <div className="role-card disabled">
                        <h3>Admin</h3>
                        <p>Coming Soon</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />

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

                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>
                
                <div className="auth-footer">
                    Already have an account?
                    <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Signup;