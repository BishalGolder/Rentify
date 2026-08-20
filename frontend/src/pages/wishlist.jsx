import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    fetchWishlist,
    removeFromWishlist
} from "../hooks/useWishlist";

import "../styles/profile-property.css";


function Wishlist() {

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();


    /*
    =====================================================
    LOAD WISHLIST
    =====================================================
    */

    useEffect(() => {

        load();

    }, []);


    const load = async () => {

        try {

            setLoading(true);

            const data =
                await fetchWishlist();

            setItems(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {

            console.error(
                "Wishlist loading error:",
                error
            );

            setItems([]);

        } finally {

            setLoading(false);

        }

    };


    /*
    =====================================================
    REMOVE FROM WISHLIST
    =====================================================
    */

    const handleRemove = async (wishlistId) => {

        const ok =
            await removeFromWishlist(
                wishlistId
            );

        if (ok) {

            setItems(
                previous =>
                    previous.filter(
                        item =>
                            item.id !== wishlistId
                    )
            );

        }

    };


    /*
    =====================================================
    BACK TO DASHBOARD
    =====================================================
    */

    const handleBackToDashboard = () => {

        navigate("/dashboard");

    };


    /*
    =====================================================
    LOADING
    =====================================================
    */

    if (loading) {

        return (

            <div className="dashboard-container">

                <div className="ui-card">

                    <h2>
                        My Wishlist
                    </h2>

                    <p>
                        Loading wishlist...
                    </p>

                </div>

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


                {/* =====================================
                    HEADER
                ===================================== */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "1.5rem",
                        flexWrap: "wrap"
                    }}
                >

                    <h2
                        style={{
                            marginBottom: 0
                        }}
                    >
                        My Wishlist
                    </h2>


                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={
                            handleBackToDashboard
                        }
                    >
                        ← Back to Dashboard
                    </button>

                </div>


                {/* =====================================
                    EMPTY WISHLIST
                ===================================== */}

                {items.length === 0 ? (

                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 20px"
                        }}
                    >

                        <h3>
                            Your wishlist is empty
                        </h3>


                        <p
                            style={{
                                color:
                                    "var(--text-muted)",
                                marginTop: "10px",
                                marginBottom: "20px"
                            }}
                        >
                            You haven't saved any
                            properties yet.
                        </p>


                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            Browse Properties
                        </button>

                    </div>

                ) : (

                    /* =================================
                       PROPERTY LIST
                    ================================= */

                    <div className="property-grid">

                        {items.map((w) => (

                            w.properties ? (

                                <div
                                    key={w.id}
                                    className="property-card"
                                >

                                    {/* PROPERTY IMAGE */}

                                    <img
                                        src={
                                            w.properties
                                                .image_urls?.[0] ||
                                            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"
                                        }
                                        alt={
                                            w.properties.title
                                        }
                                        className="property-img"
                                        style={{
                                            cursor: "pointer"
                                        }}
                                        onClick={() =>
                                            navigate(
                                                `/properties/${w.properties.id}`
                                            )
                                        }
                                    />


                                    {/* PROPERTY INFORMATION */}

                                    <div
                                        className="property-info"
                                    >

                                        <div>

                                            <div
                                                className="property-title"
                                            >
                                                {
                                                    w.properties
                                                        .title
                                                }
                                            </div>


                                            <p
                                                style={{
                                                    fontSize:
                                                        "0.85rem",
                                                    color:
                                                        "var(--text-muted)"
                                                }}
                                            >
                                                📍{" "}
                                                {
                                                    w.properties
                                                        .location
                                                }
                                            </p>

                                        </div>


                                        <div>

                                            <div
                                                className="property-price"
                                            >
                                                ৳
                                                {
                                                    w.properties
                                                        .price
                                                }
                                                /night
                                            </div>


                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                style={{
                                                    width: "100%",
                                                    marginTop:
                                                        "0.5rem"
                                                }}
                                                onClick={() =>
                                                    handleRemove(
                                                        w.id
                                                    )
                                                }
                                            >
                                                Remove
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            ) : (

                                <div
                                    key={w.id}
                                    className="property-card"
                                    style={{
                                        padding: "1rem"
                                    }}
                                >

                                    <p
                                        style={{
                                            color:
                                                "var(--text-muted)"
                                        }}
                                    >
                                        This saved property
                                        is no longer
                                        available.
                                    </p>


                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{
                                            width: "100%"
                                        }}
                                        onClick={() =>
                                            handleRemove(
                                                w.id
                                            )
                                        }
                                    >
                                        Remove from Wishlist
                                    </button>

                                </div>

                            )

                        ))}

                    </div>

                )}

            </div>

        </div>

    );

}


export default Wishlist;