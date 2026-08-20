import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Profile from "./profile";
import PropertyMarketplace from "./propertyMarketplace";
import Properties from "./properties";

import "../styles/profile-property.css";


function Dashboard() {

    const navigate = useNavigate();

    const [activeTab, setActiveTab] =
        useState("properties");

    const [user, setUser] =
        useState(null);

    const [notifications, setNotifications] =
        useState([]);

    const [showNotifications, setShowNotifications] =
        useState(false);


    /*
    =====================================================
    LOAD USER
    =====================================================
    */

    useEffect(() => {

        const storedUser =
            localStorage.getItem("user");

        const token =
            localStorage.getItem("token");


        /*
        -------------------------------------------------
        CHECK LOGIN
        -------------------------------------------------
        */

        if (!token || !storedUser) {

            navigate("/login");

            return;

        }


        /*
        -------------------------------------------------
        PARSE USER
        -------------------------------------------------
        */

        try {

            const parsedUser =
                JSON.parse(storedUser);

            setUser(parsedUser);


            /*
            =================================================
            LOAD NOTIFICATIONS
            =================================================
            */

            fetch(
                "http://localhost:5000/api/notifications",
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            )
                .then((res) => {

                    if (!res.ok) {

                        return [];

                    }

                    return res.json();

                })
                .then((data) => {

                    setNotifications(
                        Array.isArray(data)
                            ? data
                            : []
                    );

                })
                .catch((error) => {

                    console.error(
                        "Notification loading error:",
                        error
                    );

                    setNotifications([]);

                });


        } catch (error) {

            console.error(
                "Invalid stored user:",
                error
            );


            localStorage.removeItem("user");

            localStorage.removeItem("token");

            navigate("/login");

        }

    }, [navigate]);


    /*
    =====================================================
    LOGOUT
    =====================================================
    */

    const handleLogout = () => {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        alert("Logged out successfully");

        navigate("/login");

    };


    /*
    =====================================================
    MARK NOTIFICATION AS READ
    =====================================================
    */

    const handleNotificationClick = async (notification) => {

        if (notification.is_read) {

            return;

        }


        try {

            const token =
                localStorage.getItem("token");


            await fetch(
                `http://localhost:5000/api/notifications/${notification.id}/read`,
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            setNotifications((previous) => {

                return previous.map((item) => {

                    if (
                        item.id ===
                        notification.id
                    ) {

                        return {
                            ...item,
                            is_read: true
                        };

                    }

                    return item;

                });

            });

        } catch (error) {

            console.error(
                "Notification read error:",
                error
            );

        }

    };


    /*
    =====================================================
    LOADING
    =====================================================
    */

    if (!user) {

        return (

            <div className="dashboard-container">

                <div className="ui-card">

                    <p>
                        Loading session...
                    </p>

                </div>

            </div>

        );

    }


    /*
    =====================================================
    DASHBOARD
    =====================================================
    */

    return (

        <div className="dashboard-wrapper">


            {/* =================================================
                TOP NAVIGATION BAR
            ================================================= */}

            <nav className="dashboard-navbar">


                {/* LOGO */}

                <div className="nav-logo">

                    Welcome

                </div>


                {/* NAVIGATION */}

                <div className="nav-actions">


                    {/* =================================================
                        ADMIN
                    ================================================= */}

                    {user.role === "admin" && (

                        <button
                            type="button"
                            className="nav-btn"
                            onClick={() =>
                                navigate("/admin")
                            }
                        >

                            Admin Dashboard

                        </button>

                    )}


                    {/* =================================================
                        PROPERTIES
                    ================================================= */}

                    <button
                        type="button"

                        className={`nav-btn ${
                            activeTab === "properties"
                                ? "active"
                                : ""
                        }`}

                        onClick={() =>
                            setActiveTab("properties")
                        }
                    >

                        Properties

                    </button>


                    {/* =================================================
                        MY PROFILE
                    ================================================= */}

                    <button
                        type="button"

                        className={`nav-btn ${
                            activeTab === "profile"
                                ? "active"
                                : ""
                        }`}

                        onClick={() =>
                            setActiveTab("profile")
                        }
                    >

                        My Profile

                    </button>


                    {/* =================================================
                        WISHLIST
                    ================================================= */}

                    {/* Wishlist is a guest-only feature (Issue 1) */}
                    {user.role === "guest" && (
                        <button className="nav-btn" onClick={() => navigate("/wishlist")}>
                            Wishlist
                        </button>
                    )}



                    {/* =================================================
                        NOTIFICATIONS
                    ================================================= */}

                    <div
                        style={{
                            position:
                                "relative"
                        }}
                    >

                        <button
                            type="button"

                            className="nav-btn"

                            onClick={() =>
                                setShowNotifications(
                                    (value) =>
                                        !value
                                )
                            }
                        >

                            🔔


                            {/* UNREAD COUNT */}

                            {notifications.filter(
                                (notification) =>
                                    !notification.is_read
                            ).length > 0 && (

                                <span
                                    style={{
                                        background:
                                            "var(--danger-color)",

                                        color:
                                            "white",

                                        borderRadius:
                                            "999px",

                                        fontSize:
                                            "0.7rem",

                                        padding:
                                            "1px 6px",

                                        marginLeft:
                                            "4px"
                                    }}
                                >

                                    {
                                        notifications.filter(
                                            (notification) =>
                                                !notification.is_read
                                        ).length
                                    }

                                </span>

                            )}

                        </button>


                        {/* =================================================
                            NOTIFICATION DROPDOWN
                        ================================================= */}

                        {showNotifications && (

                            <div
                                style={{
                                    position:
                                        "absolute",

                                    right:
                                        0,

                                    top:
                                        "110%",

                                    width:
                                        "320px",

                                    background:
                                        "white",

                                    border:
                                        "1px solid var(--border-color)",

                                    borderRadius:
                                        "10px",

                                    boxShadow:
                                        "0 10px 30px rgba(0,0,0,0.12)",

                                    zIndex:
                                        1000,

                                    overflow:
                                        "hidden"
                                }}
                            >


                                {/* HEADER */}

                                <div
                                    style={{
                                        padding:
                                            "1rem",

                                        borderBottom:
                                            "1px solid var(--border-color)",

                                        fontWeight:
                                            "700"
                                    }}
                                >

                                    Notifications

                                </div>


                                {/* NO NOTIFICATIONS */}

                                {notifications.length === 0 ? (

                                    <p
                                        style={{
                                            padding:
                                                "1rem",

                                            color:
                                                "var(--text-muted)"
                                        }}
                                    >

                                        No notifications.

                                    </p>

                                ) : (

                                    notifications.map(
                                        (notification) => (

                                            <div
                                                key={
                                                    notification.id
                                                }

                                                style={{
                                                    padding:
                                                        "0.75rem 1rem",

                                                    borderBottom:
                                                        "1px solid var(--border-color)",

                                                    background:
                                                        notification.is_read
                                                            ? "white"
                                                            : "#eef2ff",

                                                    cursor:
                                                        "pointer"
                                                }}

                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notification
                                                    )
                                                }
                                            >

                                                <strong
                                                    style={{
                                                        fontSize:
                                                            "0.85rem"
                                                    }}
                                                >

                                                    {
                                                        notification.title
                                                    }

                                                </strong>


                                                <p
                                                    style={{
                                                        fontSize:
                                                            "0.8rem",

                                                        color:
                                                            "var(--text-muted)",

                                                        margin:
                                                            "0.25rem 0 0"
                                                    }}
                                                >

                                                    {
                                                        notification.message
                                                    }

                                                </p>

                                            </div>

                                        )
                                    )

                                )}

                            </div>

                        )}

                    </div>


                    {/* =================================================
                        LOGOUT
                    ================================================= */}

                    <button
                        type="button"

                        className="btn btn-danger logout-btn"

                        onClick={
                            handleLogout
                        }
                    >

                        Logout

                    </button>


                </div>

            </nav>


            {/* =================================================
                DASHBOARD CONTENT
            ================================================= */}

            <div className="dashboard-content">


                {/* =================================================
                    PROPERTIES
                ================================================= */}

                {activeTab === "properties" && (

                    user.role === "host"

                        ? <Properties />

                        : <PropertyMarketplace />

                )}


                {/* =================================================
                    PROFILE
                ================================================= */}

                {activeTab === "profile" && (

                    <Profile />

                )}

            </div>


        </div>

    );

}


export default Dashboard;