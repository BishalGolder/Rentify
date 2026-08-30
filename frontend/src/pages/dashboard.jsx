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