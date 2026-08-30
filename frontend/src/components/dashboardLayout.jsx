import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
 
function DashboardLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
 
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
 
        if (!token || !storedUser) {
            navigate("/login");
            return;
        }
 
        setUser(JSON.parse(storedUser));
    }, []);
 
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };
 
    if (!user) return null;
 
    return (
        <div>
            <nav className="dashboard-navbar">
                <div className="nav-logo">
                    <span
                        style={{ cursor: "pointer", fontWeight: 700, fontSize: "1.3rem" }}
                        onClick={() => navigate("/dashboard")}
                    >
                        Rentify
                    </span>
                </div>
 
                <div className="nav-actions">
                    {user.role === "admin" && (
                        <button className="nav-btn" onClick={() => navigate("/admin")}>
                            Admin Dashboard
                        </button>
                    )}
 
                    <button className="nav-btn" onClick={() => navigate("/dashboard")}>
                        Dashboard
                    </button>
 
                    <button className="nav-btn" onClick={() => navigate("/properties")}>
                        Browse Properties
                    </button>
 
                    {user.role === "guest" && (
                        <>
                            <button className="nav-btn" onClick={() => navigate("/bookings")}>
                                My Bookings
                            </button>
                            <button className="nav-btn" onClick={() => navigate("/wishlist")}>
                                Wishlist
                            </button>
                            <button className="nav-btn" onClick={() => navigate("/wallet")}>
                                Wallet
                            </button>
                        </>
                    )}
 
                    {user.role === "host" && (
                        <button className="nav-btn" onClick={() => navigate("/revenue")}>
                            Revenue
                        </button>
                    )}
 
                    <button className="nav-btn logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>
 
            {/* Each route renders inside here */}
            <Outlet />
        </div>
    );
}
 
export default DashboardLayout;
