import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
 
function DashboardLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
 
    // ── Load user from localStorage ─────────────────────
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
 
        if (!token || !storedUser) {
            navigate("/login");
            return;
        }
 
        setUser(JSON.parse(storedUser));
    }, []);
 
    // ── Fetch notifications once user is known ───────────
    useEffect(() => {
        if (!user) return;
 
        const token = localStorage.getItem("token");
 
        fetch("http://localhost:5000/api/notifications", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setNotifications(Array.isArray(data) ? data : []))
            .catch(() => setNotifications([]));
    }, [user]);
 
    // ── Mark all as read when bell is opened ─────────────
    const handleBellClick = async () => {
        const opening = !showNotifications;
        setShowNotifications(opening);
 
        if (opening && notifications.some((n) => !n.is_read)) {
            const token = localStorage.getItem("token");
 
            try {
                await fetch("http://localhost:5000/api/notifications/read-all", {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` }
                });
 
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, is_read: true }))
                );
            } catch (err) {
                console.error("Mark all read error:", err);
            }
        }
    };
 
    // ── Mark single notification as read on click ────────
    const handleNotificationClick = async (notification) => {
        if (notification.is_read) return;
 
        const token = localStorage.getItem("token");
 
        try {
            await fetch(
                `http://localhost:5000/api/notifications/${notification.id}/read`,
                { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
            );
 
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notification.id ? { ...n, is_read: true } : n
                )
            );
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };
 
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };
 
    const unreadCount = notifications.filter((n) => !n.is_read).length;
 
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
 
                    <button className="nav-btn" onClick={() => navigate("/forum")}>
                        Forum
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
 
                    {(user.role === "host" || user.role === "admin") && (
                        <button className="nav-btn" onClick={() => navigate("/coupons")}>
                            Coupons
                        </button>
                    )}
 
                    {user.role === "host" && (
                        <>
                            <button className="nav-btn" onClick={() => navigate("/revenue")}>
                                Revenue
                            </button>
                            <button className="nav-btn" onClick={() => navigate("/chat/inbox")}>
                                Messages
                            </button>
                        </>
                    )}
 
                    {/* ── Notification Bell ─────────────────────── */}
                    <div style={{ position: "relative" }}>
                        <button
                            className="nav-btn"
                            onClick={handleBellClick}
                            style={{ position: "relative" }}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span style={{
                                    position: "absolute",
                                    top: "-4px",
                                    right: "-4px",
                                    background: "#ef4444",
                                    color: "white",
                                    borderRadius: "999px",
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    minWidth: "16px",
                                    height: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "0 3px"
                                }}>
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>
 
                        {showNotifications && (
                            <div style={{
                                position: "absolute",
                                right: 0,
                                top: "110%",
                                width: "320px",
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                maxHeight: "400px",
                                overflowY: "auto",
                                zIndex: 1000
                            }}>
                                <div style={{
                                    padding: "0.75rem 1rem",
                                    borderBottom: "1px solid #e5e7eb",
                                    fontWeight: 700,
                                    fontSize: "0.9rem"
                                }}>
                                    Notifications
                                </div>
 
                                {notifications.length === 0 ? (
                                    <p style={{
                                        padding: "1rem",
                                        color: "#6b7280",
                                        fontSize: "0.85rem",
                                        textAlign: "center"
                                    }}>
                                        No notifications yet.
                                    </p>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            style={{
                                                padding: "0.75rem 1rem",
                                                borderBottom: "1px solid #f3f4f6",
                                                background: n.is_read ? "white" : "#eff6ff",
                                                cursor: n.is_read ? "default" : "pointer"
                                            }}
                                        >
                                            <div style={{
                                                fontWeight: n.is_read ? 400 : 600,
                                                fontSize: "0.85rem",
                                                marginBottom: "0.2rem"
                                            }}>
                                                {n.title}
                                            </div>
                                            <div style={{
                                                fontSize: "0.8rem",
                                                color: "#6b7280"
                                            }}>
                                                {n.message}
                                            </div>
                                            <div style={{
                                                fontSize: "0.72rem",
                                                color: "#9ca3af",
                                                marginTop: "0.25rem"
                                            }}>
                                                {new Date(n.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    {/* ── End Notification Bell ─────────────────── */}
 
                    <button className="nav-btn logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>
 
            <Outlet />
        </div>
    );
}
 
export default DashboardLayout;
