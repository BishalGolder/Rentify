import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile-property.css";


function AdminDashboard() {

    const navigate = useNavigate();

    const token = localStorage.getItem("token");


    /*
    =====================================================
    GENERAL STATE
    =====================================================
    */

    const [activeSection, setActiveSection] =
        useState("overview");

    const [loading, setLoading] =
        useState(true);

    const [loadError, setLoadError] =
        useState("");


    /*
    =====================================================
    SUMMARY STATE
    =====================================================
    */

    const [summary, setSummary] =
        useState({
            totalHosts: 0,
            totalGuests: 0,
            totalProperties: 0,
            pendingProperties: 0,
            totalBookings: 0,
            cancelledBookings: 0,
            completedBookings: 0
        });



    /*
    =====================================================
    PROPERTY VERIFICATION STATE
    =====================================================
    */

    const [pending, setPending] =
        useState([]);

    const [rejectingId, setRejectingId] =
        useState(null);

    const [rejectReason, setRejectReason] =
        useState("");

    // New state for all properties and subtab
    const [allProperties, setAllProperties] = useState([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [propertiesSubTab, setPropertiesSubTab] = useState("pending");

    // For lock/unlock
    const [lockingId, setLockingId] = useState(null);


    /*
    =====================================================
    USER STATE
    =====================================================
    */

    const [users, setUsers] =
        useState([]);


    /*
    =====================================================
    BOOKING STATE
    =====================================================
    */

    const [bookings, setBookings] =
        useState([]);

    const [reports, setReports] = useState([]);

    /*
    =====================================================
    WALLET RECHARGE STATE
    =====================================================
    */

    const [rechargeRequests, setRechargeRequests] = useState([]);


    /*
    =====================================================
    AUTHENTICATION / INITIAL LOAD
    =====================================================
    */

    useEffect(() => {

        const storedUser =
            localStorage.getItem("user");

        if (!token || !storedUser) {

            navigate("/login");

            return;
        }


        const user =
            JSON.parse(storedUser);


        if (user.role !== "admin") {

            alert("Admin access only.");

            navigate("/dashboard");

            return;
        }


        loadDashboard();

    }, []);


    /*
    =====================================================
    LOAD COMPLETE DASHBOARD
    =====================================================
    */

    const loadDashboard = async () => {

        setLoading(true);
        setLoadError("");

        try {

            await Promise.all([
                fetchSummary(),
                fetchPending(),
                fetchUsers(),
                fetchBookings(),
                fetchReports()
            ]);

        } catch (error) {

            console.error(
                "Admin dashboard loading error:",
                error
            );

            setLoadError(
                "Some dashboard information could not be loaded."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
    =====================================================
    FETCH SUMMARY
    =====================================================
    */

    const fetchSummary = async () => {

        const res = await fetch(
            "http://localhost:5000/api/admin/summary",
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await res.json();


        if (!res.ok) {

            throw new Error(
                data.message ||
                "Could not load dashboard summary."
            );

        }


        setSummary(data);

    };


    /*
    =====================================================
    FETCH PENDING PROPERTIES
    =====================================================
    */

    const fetchPending = async () => {

        const res = await fetch(
            "http://localhost:5000/api/properties/admin/pending",
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await res.json();


        if (!res.ok) {

            throw new Error(
                data.message ||
                "Could not load pending properties."
            );

        }


        setPending(
            Array.isArray(data)
                ? data
                : []
        );

    };


    /*
    =====================================================
    FETCH USERS
    =====================================================
    */

    const fetchUsers = async () => {

        const res = await fetch(
            "http://localhost:5000/api/profiles/admin/users",
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await res.json();


        if (!res.ok) {

            throw new Error(
                data.message ||
                "Could not load users."
            );

        }


        setUsers(
            Array.isArray(data)
                ? data
                : []
        );

    };


    /*
    =====================================================
    FETCH BOOKINGS
    =====================================================
    */

    const fetchBookings = async () => {

        const res = await fetch(
            "http://localhost:5000/api/bookings/admin/all",
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await res.json();


        if (!res.ok) {

            throw new Error(
                data.message ||
                "Could not load bookings."
            );

        }


        setBookings(
            Array.isArray(data)
                ? data
                : []
        );

    };
    /*fetch reports*/
    const fetchReports = async () => {

    const res = await fetch(
        "http://localhost:5000/api/reports/admin/all",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(
            data.message ||
            "Could not load reports."
        );
    }

    setReports(
        Array.isArray(data)
            ? data
            : []
    );
};

    /*
    =====================================================
    FETCH RECHARGE REQUESTS (LAZY LOAD)
    =====================================================
    */

    const loadRechargeRequests = async () => {

        const res = await fetch(
            "http://localhost:5000/api/wallet/admin/recharge-requests",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (res.ok) {

            const data = await res.json();

            setRechargeRequests(
                Array.isArray(data) ? data : []
            );

        } else {

            setRechargeRequests([]);

        }
    };

    /*
    =====================================================
    DECIDE RECHARGE REQUEST
    =====================================================
    */

    const decideRecharge = async (id, action) => {
 
        const res = await fetch(
            `http://localhost:5000/api/wallet/admin/recharge-requests/${id}/${action}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({})
            }
        );

        if (res.ok) {

            setRechargeRequests((prev) =>
                prev.filter((r) => r.id !== id)
            );

        } else {

            alert("Action failed.");

        }
    };

    /*
    =====================================================
    LAZY LOAD RECHARGE REQUESTS ON TAB SWITCH
    =====================================================
    */

    useEffect(() => {

        if (activeSection === "wallet" && token) {

            loadRechargeRequests();

        }

    }, [activeSection, token]);


    /*
    =====================================================
    VERIFY / REJECT PROPERTY
    =====================================================
    */

    const decide = async (
        id,
        status,
        reason = null
    ) => {

        try {

            const res = await fetch(
                `http://localhost:5000/api/properties/admin/${id}/verify`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        status,
                        rejection_reason: reason
                    })
                }
            );


            const data =
                await res.json();


            if (!res.ok) {

                alert(
                    data.message ||
                    "Action failed."
                );

                return;
            }


            setPending(
                (prev) =>
                    prev.filter(
                        (p) => p.id !== id
                    )
            );


            setRejectingId(null);

            setRejectReason("");


            /*
                Refresh summary so pending
                property count changes immediately.
            */
            await fetchSummary();


        } catch (error) {

            console.error(
                "Property verification error:",
                error
            );

            alert("Network error.");

        }

    };

    /*
    =====================================================
    ADMIN DELETE PROPERTY
    =====================================================
    */

    const handleAdminDeleteProperty = async (propertyId, propertyTitle) => {
        if (!window.confirm(`Delete "${propertyTitle}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(
                `http://localhost:5000/api/properties/admin/${propertyId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.ok) {
                // Remove from pending and all properties lists
                setPending((prev) => prev.filter((p) => p.id !== propertyId));
                setAllProperties((prev) => prev.filter((p) => p.id !== propertyId));
                // Refresh summary to update counts
                await fetchSummary();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete property.");
            }
        } catch (error) {
            alert("Network error while deleting property.");
        }
    };

    /*
    =====================================================
    TOGGLE PROPERTY LOCK
    =====================================================
    */

    const handleToggleLock = async (propertyId, currentLock, propertyTitle) => {
        const action = currentLock ? "unlock" : "lock";
        if (!window.confirm(`Are you sure you want to ${action} "${propertyTitle}"?`)) return;
        setLockingId(propertyId);
        try {
            const res = await fetch(`http://localhost:5000/api/properties/admin/${propertyId}/lock`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ lock: !currentLock })
            });

            if (res.ok) {
                const data = await res.json();
                // Update allProperties state
                setAllProperties(prev =>
                    prev.map(p =>
                        p.id === propertyId ? { ...p, is_locked: !currentLock } : p
                    )
                );
                // Also update pending if this property is in pending (shouldn't be, but just in case)
                setPending(prev =>
                    prev.map(p =>
                        p.id === propertyId ? { ...p, is_locked: !currentLock } : p
                    )
                );
            } else {
                const data = await res.json();
                alert(data.message || `Failed to ${action} property.`);
            }
        } catch (error) {
            alert("Network error while toggling lock.");
        } finally {
            setLockingId(null);
        }
    };

    /*
    =====================================================
    LOAD ALL PROPERTIES (including locked)
    =====================================================
    */

    const loadAllProperties = async () => {
        setPropertiesLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/properties/admin/all", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAllProperties(data);
            } else {
                const data = await res.json().catch(() => ({}));
                console.error("Failed to load all properties:", data.message || res.status);
                alert(data.message || "Failed to load properties. Please try again.");
            }

        } catch (err) {
            console.error("Load all properties error:", err);
        } finally {
            setPropertiesLoading(false);
        }
    };

    // Load all properties when subtab switches to "all"
    useEffect(() => {
        if (activeSection === "verification" && propertiesSubTab === "all") {
            loadAllProperties();
        }
    }, [activeSection, propertiesSubTab]);


    /*
    =====================================================
    CHANGE USER ROLE
    =====================================================
    */

   const changeUserRole = async (userId, newRole, oldRole) => {

    if (newRole === oldRole) {
        return;
    }

    const selectedUser = users.find(
        (user) => user.id === userId
    );

    const userName =
        selectedUser?.full_name || "this user";

    const confirmed = window.confirm(
        `Change ${userName}'s role from ${oldRole} to ${newRole}?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const res = await fetch(
            `http://localhost:5000/api/profiles/${userId}/role`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    role: newRole
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            alert(
                data.message ||
                "Could not change user role."
            );
            return;
        }

        setUsers((prev) =>
            prev.map((user) =>
                user.id === userId
                    ? {
                        ...user,
                        role: newRole
                    }
                    : user
            )
        );

        await fetchSummary();

        alert("User role updated successfully.");

    } catch (error) {

        console.error(
            "Role update error:",
            error
        );

        alert("Network error.");
    }
};
    /*reports*/
    const updateReport = async (
    reportId,
    status,
    adminNote = ""
) => {

    try {

        const res = await fetch(
            `http://localhost:5000/api/reports/admin/${reportId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    status,
                    admin_note: adminNote
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {

            alert(
                data.message ||
                "Could not update report."
            );

            return;
        }


        setReports((prev) =>
            prev.map((report) =>
                report.id === reportId
                    ? data.report
                    : report
            )
        );


        alert(
            "Report updated successfully."
        );


    } catch (error) {

        console.error(
            "Report update error:",
            error
        );

        alert(
            "Network error while updating report."
        );
    }
};

    /*
    =====================================================
    LOADING
    =====================================================
    */

    if (loading) {

        return (
            <div className="dashboard-container">
                Loading Admin Dashboard...
            </div>
        );

    }


    /*
    =====================================================
    PAGE
    =====================================================
    */

    return (

        <div className="dashboard-container">

            <div className="ui-card">
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate("/dashboard")}
                    style={{
                        marginBottom: "1rem"
                    }}
                >
                    ← Back to Dashboard
                </button>
                <h1>
                    Admin Dashboard
                </h1>

                <p
                    style={{
                        color:
                            "var(--text-muted)"
                    }}
                >
                    Monitor and manage Rentify platform activity.
                </p>


                {loadError && (

                    <p
                        style={{
                            color:
                                "var(--danger-color)"
                        }}
                    >
                        {loadError}
                    </p>

                )}


                {/* ===============================
                    NAVIGATION
                =============================== */}

                <div
                    style={{
                        display: "flex",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                        margin:
                            "1.5rem 0"
                    }}
                >

                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            setActiveSection(
                                "overview"
                            )
                        }
                    >
                        Overview
                    </button>


                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            setActiveSection(
                                "verification"
                            )
                        }
                    >
                        Properties
                    </button>



                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            setActiveSection(
                                "users"
                            )
                        }
                    >
                        Users
                    </button>


                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            setActiveSection(
                                "bookings"
                            )
                        }
                    >
                        Bookings
                    </button>


                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            setActiveSection(
                                "reports"
                            )
                        }
                    >
                        Reports
                    </button>

                    {/* NEW: Wallet Recharges button */}
                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            setActiveSection(
                                "wallet"
                            )
                        }
                    >
                        Wallet Recharges
                    </button>

                </div>


                {/* ===============================
                    OVERVIEW
                =============================== */}

                {activeSection === "overview" && (

                    <div>

                        <h2>
                            Platform Overview
                        </h2>


                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "1rem",
                                marginTop:
                                    "1rem"
                            }}
                        >

                            <div className="ui-card">
                                <h3>
                                    Total Users
                                </h3>

                                <div
                                    style={{
                                        fontSize:
                                            "2rem",
                                        fontWeight:
                                            "bold"
                                    }}
                                >
                                    {summary.totalHosts + summary.totalGuests}
                                </div>
                            </div>


                            <div className="ui-card">

                                <h3>
                                    Hosts
                                </h3>

                                <div
                                    style={{
                                        fontSize:
                                            "2rem",
                                        fontWeight:
                                            "bold"
                                    }}
                                >
                                    {summary.totalHosts}
                                </div>

                            </div>

                            <div className="ui-card">

                                <h3>
                                    Guests
                                </h3>

                                <div
                                    style={{
                                        fontSize:
                                            "2rem",
                                        fontWeight:
                                            "bold"
                                    }}
                                >
                                    {summary.totalGuests}
                                </div>

                            </div>


                            <div className="ui-card">

                                <h3>
                                    Properties
                                </h3>

                                <div
                                    style={{
                                        fontSize:
                                            "2rem",
                                        fontWeight:
                                            "bold"
                                    }}
                                >
                                    {summary.totalProperties}
                                </div>

                            </div>


                            <div className="ui-card">

                                <h3>
                                    Pending Verification
                                </h3>

                                <div
                                    style={{
                                        fontSize:
                                            "2rem",
                                        fontWeight:
                                            "bold"
                                    }}
                                >
                                    {summary.pendingProperties}
                                </div>

                            </div>


                            <div className="ui-card">

                                <h3>
                                    Total Bookings
                                </h3>

                                <div
                                    style={{
                                        fontSize:
                                            "2rem",
                                        fontWeight:
                                            "bold"
                                    }}
                                >
                                    {summary.totalBookings}
                                </div>

                            </div>

                            <div className="ui-card">

                                <h3>
                                    Cancelled Bookings
                                </h3>

                                <div
                                    style={{
                                        fontSize:
                                            "2rem",
                                        fontWeight:
                                            "bold"
                                    }}
                                >
                                    {summary.cancelledBookings}
                                </div>

                            </div>

                            <div className="ui-card">

                                <h3>
                                    Completed Bookings
                                </h3>

                                <div
                                    style={{
                                        fontSize:
                                            "2rem",
                                        fontWeight:
                                            "bold"
                                    }}
                                >
                                    {summary.completedBookings}
                                </div>

                            </div>

                        </div>

                    </div>

                )}


                {/* ===============================
                    PROPERTY VERIFICATION
                =============================== */}

                {activeSection === "verification" && (

                    <div>

                        <h2>
                            Property Management
                        </h2>

                        {/* Subtab navigation */}
                        <div
                            style={{
                                display: "flex",
                                gap: "0.5rem",
                                marginBottom: "1.5rem",
                                borderBottom: "1px solid #e5e7eb",
                                paddingBottom: "0.5rem"
                            }}
                        >
                            <button
                                className={`btn ${propertiesSubTab === "pending" ? "btn-primary" : "btn-secondary"}`}
                                onClick={() => setPropertiesSubTab("pending")}
                            >
                                Pending ({pending.length})
                            </button>
                            <button
                                className={`btn ${propertiesSubTab === "all" ? "btn-primary" : "btn-secondary"}`}
                                onClick={() => setPropertiesSubTab("all")}
                            >
                                All Properties
                            </button>
                        </div>

                        {propertiesSubTab === "pending" && (
                            <>
                                {pending.length === 0 ? (

                                    <p
                                        style={{
                                            color:
                                                "var(--text-muted)"
                                        }}
                                    >
                                        No properties awaiting review.
                                    </p>

                                ) : (

                                    <div className="property-grid">

                                        {pending.map(
                                            (prop) => (

                                                <div
                                                    key={prop.id}
                                                    className="property-card"
                                                >

                                                    <img
                                                        src={
                                                            prop.image_urls?.[0] ||
                                                            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"
                                                        }
                                                        alt={
                                                            prop.title
                                                        }
                                                        className="property-img"
                                                    />


                                                    <div className="property-info">

                                                        <span className="badge">
                                                            {
                                                                prop.property_type
                                                            }
                                                        </span>


                                                        <div className="property-title">
                                                            {
                                                                prop.title
                                                            }
                                                        </div>


                                                        <p>
                                                            📍{" "}
                                                            {
                                                                prop.location
                                                            }

                                                            {
                                                                prop.district
                                                                    ? ` — ${prop.district}`
                                                                    : ""
                                                            }
                                                        </p>


                                                        <p>
                                                            {
                                                                prop.description
                                                            }
                                                        </p>


                                                        <div className="property-price">
                                                            ৳
                                                            {
                                                                prop.price
                                                            }{" "}
                                                            / night
                                                        </div>


                                                        {rejectingId === prop.id ? (

                                                            <div
                                                                style={{
                                                                    marginTop:
                                                                        "1rem"
                                                                }}
                                                            >

                                                                <textarea
                                                                    placeholder="Reason for rejection"
                                                                    value={
                                                                        rejectReason
                                                                    }
                                                                    onChange={
                                                                        (e) =>
                                                                            setRejectReason(
                                                                                e.target.value
                                                                            )
                                                                    }
                                                                    style={{
                                                                        width:
                                                                            "100%",
                                                                        minHeight:
                                                                            "80px"
                                                                    }}
                                                                />


                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        gap:
                                                                            "0.5rem",
                                                                        marginTop:
                                                                            "0.5rem"
                                                                    }}
                                                                >

                                                                    <button
                                                                        className="btn btn-danger"
                                                                        disabled={
                                                                            !rejectReason.trim()
                                                                        }
                                                                        onClick={() =>
                                                                            decide(
                                                                                prop.id,
                                                                                "rejected",
                                                                                rejectReason.trim()
                                                                            )
                                                                        }
                                                                    >
                                                                        Confirm Reject
                                                                    </button>


                                                                    <button
                                                                        className="btn btn-secondary"
                                                                        onClick={() => {
                                                                            setRejectingId(
                                                                                null
                                                                            );

                                                                            setRejectReason(
                                                                                ""
                                                                            );
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </button>

                                                                </div>

                                                            </div>

                                                        ) : (

                                                            <div
                                                                className="property-actions"
                                                                style={{
                                                                    display: "flex",
                                                                    flexWrap: "wrap",
                                                                    gap: "0.5rem",
                                                                    marginTop: "1rem"
                                                                }}
                                                            >

                                                                <button
                                                                    className="btn btn-primary"
                                                                    onClick={() =>
                                                                        decide(
                                                                            prop.id,
                                                                            "verified"
                                                                        )
                                                                    }
                                                                >
                                                                    Approve
                                                                </button>


                                                                <button
                                                                    className="btn btn-danger"
                                                                    onClick={() =>
                                                                        setRejectingId(
                                                                            prop.id
                                                                        )
                                                                    }
                                                                >
                                                                    Reject
                                                                </button>

                                                                {/* Admin delete button */}
                                                                <button
                                                                    className="btn btn-danger"
                                                                    style={{ backgroundColor: "#dc2626" }}
                                                                    onClick={() =>
                                                                        handleAdminDeleteProperty(prop.id, prop.title)
                                                                    }
                                                                >
                                                                    Delete Property
                                                                </button>

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}
                            </>
                        )}

                        {propertiesSubTab === "all" && (
                            <>
                                {propertiesLoading ? (
                                    <p>Loading properties...</p>
                                ) : allProperties.length === 0 ? (
                                    <p style={{ color: "var(--text-muted)" }}>No properties found.</p>
                                ) : (
                                    <div className="property-grid">
                                        {allProperties.map((prop) => (
                                            <div key={prop.id} className="property-card">
                                                <img
                                                    src={prop.image_urls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"}
                                                    alt={prop.title}
                                                    className="property-img"
                                                />
                                                <div className="property-info">
                                                    <div className="property-title">{prop.title}</div>
                                                    <p>📍 {prop.location}</p>
                                                    <div className="property-price">৳{prop.price} / night</div>
                                                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                                                        <span className="badge">{prop.verification_status}</span>
                                                        {prop.is_locked ? (
                                                            <span className="badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>🔒 Locked</span>
                                                        ) : (
                                                            <span className="badge" style={{ background: "#dcfce7", color: "#166534" }}>🔓 Unlocked</span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                                                        <button
                                                            className="btn btn-secondary"
                                                            onClick={() => handleToggleLock(prop.id, prop.is_locked, prop.title)}
                                                            disabled={lockingId === prop.id}
                                                        >
                                                            {lockingId === prop.id ? "Processing..." : (prop.is_locked ? "Unlock" : "Lock")}
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => handleAdminDeleteProperty(prop.id, prop.title)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                    </div>

                )}
{/* ===============================
    USERS
=============================== */}

{activeSection === "users" && (

    <div>

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "1rem"
            }}
        >
            <div>
                <h2 style={{ marginBottom: "0.25rem" }}>
                    User Management
                </h2>

                <p
                    style={{
                        margin: 0,
                        color: "var(--text-muted)"
                    }}
                >
                    View registered users and manage their roles.
                </p>
            </div>

            <div
                style={{
                    fontWeight: "600",
                    color: "var(--text-muted)"
                }}
            >
                Total users: {users.length}
            </div>
        </div>


        {users.length === 0 ? (

            <p style={{ color: "var(--text-muted)" }}>
                No users found.
            </p>

        ) : (

            <div
                style={{
                    overflowX: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px"
                }}
            >

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: "760px"
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background: "#f8fafc",
                                textAlign: "left"
                            }}
                        >
                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Name
                            </th>

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Phone
                            </th>

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Current Role
                            </th>

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Change Role
                            </th>
                        </tr>

                    </thead>


                    <tbody>

                        {users.map((user) => (

                            <tr
                                key={user.id}
                                style={{
                                    borderBottom: "1px solid #f1f5f9"
                                }}
                            >

                                <td
                                    style={{
                                        padding: "14px 16px",
                                        fontWeight: "600"
                                    }}
                                >
                                    {user.full_name || "Unnamed User"}
                                </td>


                                <td
                                    style={{
                                        padding: "14px 16px",
                                        color: "var(--text-muted)"
                                    }}
                                >
                                    {user.phone || "—"}
                                </td>


                                <td
                                    style={{
                                        padding: "14px 16px"
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            padding: "5px 10px",
                                            borderRadius: "999px",
                                            background:
                                                user.role === "admin"
                                                    ? "#ede9fe"
                                                    : user.role === "host"
                                                        ? "#dbeafe"
                                                        : "#ecfdf5",
                                            color:
                                                user.role === "admin"
                                                    ? "#6d28d9"
                                                    : user.role === "host"
                                                        ? "#1d4ed8"
                                                        : "#047857",
                                            fontWeight: "700",
                                            fontSize: "0.8rem",
                                            textTransform: "uppercase"
                                        }}
                                    >
                                        {user.role}
                                    </span>
                                </td>


                                <td
                                    style={{
                                        padding: "14px 16px"
                                    }}
                                >

                                    <select
                                        value={user.role}
                                        onChange={(e) =>
                                            changeUserRole(
                                                user.id,
                                                e.target.value,
                                                user.role
                                            )
                                        }
                                        style={{
                                            padding: "8px 10px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            background: "white",
                                            cursor: "pointer"
                                        }}
                                    >

                                        <option value="guest">
                                            Guest
                                        </option>

                                        <option value="host">
                                            Host
                                        </option>

                                        <option value="admin">
                                            Admin
                                        </option>

                                    </select>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        )}

    </div>

)}
{/* ===============================
    BOOKINGS
=============================== */}

{activeSection === "bookings" && (

    <div>

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "1rem"
            }}
        >
            <div>
                <h2 style={{ marginBottom: "0.25rem" }}>
                    Booking Monitoring
                </h2>

                <p
                    style={{
                        margin: 0,
                        color: "var(--text-muted)"
                    }}
                >
                    Monitor bookings made across the Rentify platform.
                </p>
            </div>

            <div
                style={{
                    fontWeight: "600",
                    color: "var(--text-muted)"
                }}
            >
                Total bookings: {bookings.length}
            </div>
        </div>


        {bookings.length === 0 ? (

            <p
                style={{
                    color: "var(--text-muted)"
                }}
            >
                No bookings found.
            </p>

        ) : (

            <div
                style={{
                    overflowX: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px"
                }}
            >

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: "950px"
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background: "#f8fafc",
                                textAlign: "left"
                            }}
                        >

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Property
                            </th>

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Check In
                            </th>

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Check Out
                            </th>

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Guests
                            </th>

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Total Price
                            </th>

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Status
                            </th>

                            <th
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                Booked On
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {bookings.map((booking) => (

                            <tr
                                key={booking.id}
                                style={{
                                    borderBottom: "1px solid #f1f5f9"
                                }}
                            >

                                <td
                                    style={{
                                        padding: "14px 16px",
                                        fontWeight: "600"
                                    }}
                                >
                                    {booking.properties?.title ||
                                        "Unknown Property"}

                                    {booking.properties?.district && (
                                        <div
                                            style={{
                                                fontSize: "0.8rem",
                                                fontWeight: "400",
                                                color: "var(--text-muted)",
                                                marginTop: "3px"
                                            }}
                                        >
                                            {booking.properties.district}
                                        </div>
                                    )}
                                </td>


                                <td
                                    style={{
                                        padding: "14px 16px"
                                    }}
                                >
                                    {booking.check_in}
                                </td>


                                <td
                                    style={{
                                        padding: "14px 16px"
                                    }}
                                >
                                    {booking.check_out}
                                </td>


                                <td
                                    style={{
                                        padding: "14px 16px"
                                    }}
                                >
                                    {booking.number_of_guests}
                                </td>


                                <td
                                    style={{
                                        padding: "14px 16px",
                                        fontWeight: "600"
                                    }}
                                >
                                    ৳{Number(
                                        booking.total_price || 0
                                    ).toLocaleString()}
                                </td>


                                <td
                                    style={{
                                        padding: "14px 16px"
                                    }}
                                >

                                    <span
                                        style={{
                                            display: "inline-block",
                                            padding: "5px 10px",
                                            borderRadius: "999px",
                                            fontWeight: "700",
                                            fontSize: "0.78rem",
                                            textTransform: "uppercase",

                                            background:
                                                booking.status === "completed"
                                                    ? "#dcfce7"
                                                    : booking.status === "cancelled"
                                                        ? "#fee2e2"
                                                        : booking.status === "pending"
                                                            ? "#fef3c7"
                                                            : "#dbeafe",

                                            color:
                                                booking.status === "completed"
                                                    ? "#166534"
                                                    : booking.status === "cancelled"
                                                        ? "#b91c1c"
                                                        : booking.status === "pending"
                                                            ? "#92400e"
                                                            : "#1d4ed8"
                                        }}
                                    >
                                        {booking.status}
                                    </span>

                                </td>


                                <td
                                    style={{
                                        padding: "14px 16px",
                                        color: "var(--text-muted)"
                                    }}
                                >
                                    {booking.created_at
                                        ? new Date(
                                            booking.created_at
                                        ).toLocaleDateString()
                                        : "—"}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        )}

    </div>

)}

                {/* ===============================
                    REPORTS
                =============================== */}

                {activeSection === "reports" && (

                    <div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "1rem",
                                flexWrap: "wrap",
                                marginBottom: "1rem"
                            }}
                        >
                            <div>
                                <h2 style={{ marginBottom: "0.25rem" }}>
                                    Reports Management
                                </h2>

                                <p
                                    style={{
                                        margin: 0,
                                        color: "var(--text-muted)"
                                    }}
                                >
                                    Review reported properties and take appropriate action.
                                </p>
                            </div>

                            <div
                                style={{
                                    fontWeight: "600",
                                    color: "var(--text-muted)"
                                }}
                            >
                                Total reports: {reports.length}
                            </div>
                        </div>


                        {reports.length === 0 ? (

                            <p
                                style={{
                                    color: "var(--text-muted)"
                                }}
                            >
                                No reports found.
                            </p>

                        ) : (

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1rem"
                                }}
                            >

                                {reports.map((report) => (

                                    <div
                                        key={report.id}
                                        style={{
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "12px",
                                            padding: "1rem"
                                        }}
                                    >

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: "1rem",
                                                flexWrap: "wrap",
                                                marginBottom: "0.75rem"
                                            }}
                                        >

                                            <div>

                                                <h3
                                                    style={{
                                                        margin: "0 0 0.25rem 0"
                                                    }}
                                                >
                                                    {
                                                        report.properties?.title ||
                                                        "Unknown Property"
                                                    }
                                                </h3>

                                                <p
                                                    style={{
                                                        margin: 0,
                                                        color: "var(--text-muted)"
                                                    }}
                                                >
                                                    Reported by:{" "}
                                                    {
                                                        report.profiles?.full_name ||
                                                        "Unknown User"
                                                    }
                                                </p>

                                            </div>


                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "5px 10px",
                                                    borderRadius: "999px",
                                                    fontWeight: "700",
                                                    fontSize: "0.78rem",
                                                    textTransform: "uppercase",

                                                    background:
                                                        report.status === "resolved"
                                                            ? "#dcfce7"
                                                            : report.status === "rejected"
                                                                ? "#fee2e2"
                                                                : report.status === "reviewed"
                                                                    ? "#dbeafe"
                                                                    : "#fef3c7",

                                                    color:
                                                        report.status === "resolved"
                                                            ? "#166534"
                                                            : report.status === "rejected"
                                                                ? "#b91c1c"
                                                                : report.status === "reviewed"
                                                                    ? "#1d4ed8"
                                                                    : "#92400e"
                                                }}
                                            >
                                                {report.status}
                                            </span>

                                        </div>


                                        <p>
                                            <strong>Category:</strong>{" "}
                                            {report.category
                                                ?.replaceAll("_", " ")}
                                        </p>


                                        <p>
                                            <strong>Description:</strong>{" "}
                                            {report.description}
                                        </p>


                                        <p
                                            style={{
                                                color: "var(--text-muted)",
                                                fontSize: "0.9rem"
                                            }}
                                        >
                                            Submitted:{" "}
                                            {
                                                report.created_at
                                                    ? new Date(
                                                        report.created_at
                                                    ).toLocaleString()
                                                    : "—"
                                            }
                                        </p>


                                        {report.admin_note && (

                                            <p>
                                                <strong>Admin Note:</strong>{" "}
                                                {report.admin_note}
                                            </p>

                                        )}


                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "0.75rem",
                                                flexWrap: "wrap",
                                                marginTop: "1rem"
                                            }}
                                        >

                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => {

                                                    const note =
                                                        window.prompt(
                                                            "Optional admin note:",
                                                            report.admin_note || ""
                                                        );

                                                    if (note === null) {
                                                        return;
                                                    }

                                                    updateReport(
                                                        report.id,
                                                        "reviewed",
                                                        note
                                                    );
                                                }}
                                            >
                                                Mark Reviewed
                                            </button>


                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() => {

                                                    const note =
                                                        window.prompt(
                                                            "Resolution note:",
                                                            report.admin_note || ""
                                                        );

                                                    if (note === null) {
                                                        return;
                                                    }

                                                    updateReport(
                                                        report.id,
                                                        "resolved",
                                                        note
                                                    );
                                                }}
                                            >
                                                Resolve
                                            </button>


                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                onClick={() => {

                                                    const note =
                                                        window.prompt(
                                                            "Reason for rejecting this report:",
                                                            report.admin_note || ""
                                                        );

                                                    if (note === null) {
                                                        return;
                                                    }

                                                    updateReport(
                                                        report.id,
                                                        "rejected",
                                                        note
                                                    );
                                                }}
                                            >
                                                Reject
                                            </button>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                )}

                {/* ===============================
                    WALLET RECHARGES
                =============================== */}

                {activeSection === "wallet" && (

                    <div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "1rem",
                                flexWrap: "wrap",
                                marginBottom: "1rem"
                            }}
                        >
                            <div>
                                <h2 style={{ marginBottom: "0.25rem" }}>
                                    Wallet Recharges
                                </h2>

                                <p
                                    style={{
                                        margin: 0,
                                        color: "var(--text-muted)"
                                    }}
                                >
                                    Approve or reject guest recharge requests.
                                </p>
                            </div>

                            <div
                                style={{
                                    fontWeight: "600",
                                    color: "var(--text-muted)"
                                }}
                            >
                                Pending requests: {rechargeRequests.length}
                            </div>
                        </div>

                        {rechargeRequests.length === 0 ? (

                            <p
                                style={{
                                    color: "var(--text-muted)"
                                }}
                            >
                                No pending recharge requests.
                            </p>

                        ) : (

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1rem"
                                }}
                            >

                                {rechargeRequests.map((request) => (

                                    <div
                                        key={request.id}
                                        style={{
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "12px",
                                            padding: "1rem",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                            gap: "0.75rem"
                                        }}
                                    >
                                        <div>
                                            <strong>
                                                {request.profiles?.full_name || "Guest"}
                                            </strong>
                                            {" — "}
                                            ৳{request.amount}
                                            <div
                                                style={{
                                                    fontSize: "0.85rem",
                                                    color: "var(--text-muted)"
                                                }}
                                            >
                                                {request.created_at
                                                    ? new Date(
                                                        request.created_at
                                                    ).toLocaleString()
                                                    : "—"}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "0.5rem"
                                            }}
                                        >
                                            <button
                                                className="btn btn-primary"
                                                onClick={() =>
                                                    decideRecharge(request.id, "approve")
                                                }
                                            >
                                                Approve
                                            </button>

                                            <button
                                                className="btn btn-danger"
                                                onClick={() =>
                                                    decideRecharge(request.id, "reject")
                                                }
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                )}

            </div>

        </div>

    );

}


export default AdminDashboard;