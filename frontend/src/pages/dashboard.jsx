import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Profile from "./profile"; // Adjust path if needed
import PropertyMarketplace from "./propertyMarketplace";
import "../styles/profile-property.css";

function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("properties");
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Retrieve the logged-in user details we saved during login
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        // If no token exists, boot them back to the login page
        if (!token || !storedUser) {
            navigate("/login");
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Logged out successfully");
        navigate("/login");
    };

    if (!user) return <div className="dashboard-container">Loading session...</div>;

    return (
        <div className="dashboard-wrapper">
            {/* Top Navigation Bar */}
            <nav className="dashboard-navbar">
                <div className="nav-logo">Welcome</div>
                <div className="nav-actions">
                    <button 
                        className={`nav-btn ${activeTab === "properties" ? "active" : ""}`}
                        onClick={() => setActiveTab("properties")}
                    >
                        Properties
                    </button>
                    <button 
                        className={`nav-btn ${activeTab === "profile" ? "active" : ""}`}
                        onClick={() => setActiveTab("profile")}
                    >
                        My Profile
                    </button>
                    <button className="btn btn-danger logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Dashboard Workspace */}
            <div className="dashboard-content">

                {activeTab === "properties" && (
                    user.role === "host"
                    ? <h2 style={{ textAlign: "center" }}>Host Property Management (Coming Next)</h2>
                    : <PropertyMarketplace />
                )}

                {activeTab === "profile" && (
                    <Profile />
                )}

            </div>
        </div>
    );
}

export default Dashboard;