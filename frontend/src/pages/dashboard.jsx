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