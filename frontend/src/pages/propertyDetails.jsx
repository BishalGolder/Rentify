import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { addRecentlyViewed } from "../hooks/useRecentlyViewed";

import "../styles/profile-property.css";


function PropertyDetails() {

    const { id } = useParams();

    const navigate = useNavigate();


    const [property, setProperty] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [notFound, setNotFound] =
        useState(false);

    const [activeImage, setActiveImage] =
        useState(0);


    useEffect(() => {

        fetchProperty();

    }, [id]);


    const fetchProperty = async () => {

        setLoading(true);

        setNotFound(false);

        try {

            const res =
                await fetch(
                    `http://localhost:5000/api/properties/${id}`
                );


            if (res.ok) {

                const data =
                    await res.json();

                setProperty(data);

                addRecentlyViewed(data);

            } else {

                setNotFound(true);

            }

        } catch (err) {

            console.error(
                "Property loading error:",
                err
            );

            setNotFound(true);

        } finally {

            setLoading(false);

        }

    };

    const handleBackToDashboard = () => {

        navigate("/dashboard");

    };


    if (loading) {

        return (

            <div className="dashboard-container">

                <div className="ui-card">

                    <p>
                        Loading property...
                    </p>

                </div>

            </div>

        );

    }


    if (notFound || !property) {

        return (

            <div className="dashboard-container">

                <div
                    className="ui-card"
                    style={{
                        textAlign: "center"
                    }}
                >

                    <p>
                        This property is unavailable
                        or no longer exists.
                    </p>


                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={
                            handleBackToDashboard
                        }
                        style={{
                            marginTop: "1rem"
                        }}
                    >
                        ← Back to Dashboard
                    </button>

                </div>

            </div>

        );

    }

    const images =
        property.image_urls?.length
            ? property.image_urls
            : [
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"
            ];

    return (

        <div className="dashboard-container">

            <div className="ui-card">

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={
                        handleBackToDashboard
                    }
                    style={{
                        marginBottom: "1rem"
                    }}
                >
                    ← Back to Properties
                </button>

                <img
                    src={
                        images[activeImage]
                    }
                    alt={
                        property.title
                    }
                    style={{
                        width: "100%",
                        maxHeight: "420px",
                        objectFit: "cover",
                        borderRadius: "10px"
                    }}
                />

                {images.length > 1 && (

                    <div
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginTop: "0.75rem",
                            flexWrap: "wrap"
                        }}
                    >

                        {images.map(
                            (img, i) => (

                                <img
                                    key={i}
                                    src={img}
                                    alt={
                                        `thumbnail-${i}`
                                    }
                                    onClick={() =>
                                        setActiveImage(i)
                                    }
                                    style={{
                                        width: "70px",
                                        height: "70px",
                                        objectFit: "cover",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        border:
                                            i === activeImage
                                                ? "2px solid var(--primary-color)"
                                                : "2px solid transparent"
                                    }}
                                />

                            )
                        )}

                    </div>

                )}

                <div
                    style={{
                        marginTop: "1.5rem"
                    }}
                >

                    <span className="badge">

                        {
                            property.property_type
                        }

                    </span>

                    <h2
                        style={{
                            margin: "0.5rem 0"
                        }}
                    >

                        {
                            property.title
                        }

                    </h2>

                    <p
                        style={{
                            color:
                                "var(--text-muted)"
                        }}
                    >

                        📍{" "}

                        {
                            property.location
                        }

                        {
                            property.district
                                ? ` — ${property.district}`
                                : ""
                        }

                    </p>

                    <p
                        style={{
                            margin: "1rem 0"
                        }}
                    >

                        {
                            property.description
                        }

                    </p>

                    <div
                        style={{
                            display: "flex",
                            gap: "1.5rem",
                            margin: "1rem 0",
                            flexWrap: "wrap"
                        }}
                    >

                        <span>
                            🛏{" "}
                            {
                                property.bedrooms ??
                                "-"
                            }{" "}
                            Bedrooms
                        </span>


                        <span>
                            🛁{" "}
                            {
                                property.bathrooms ??
                                "-"
                            }{" "}
                            Bathrooms
                        </span>


                        <span>
                            👥{" "}
                            {
                                property.maximum_guests ??
                                "-"
                            }{" "}
                            Guests max
                        </span>


                        <span>
                            ⭐{" "}
                            {
                                property.average_rating ??
                                "No ratings yet"
                            }
                        </span>

                    </div>

                    {
                        property.amenities?.length >
                            0 && (

                            <div
                                style={{
                                    margin: "1rem 0"
                                }}
                            >

                                <strong>
                                    Amenities
                                </strong>


                                <div
                                    style={{
                                        marginTop:
                                            "0.5rem"
                                    }}
                                >

                                    {
                                        property.amenities.map(
                                            (a) => (

                                                <span
                                                    key={a}
                                                    className="badge"
                                                    style={{
                                                        background:
                                                            "#f3f4f6",
                                                        color:
                                                            "#374151"
                                                    }}
                                                >
                                                    {a}
                                                </span>

                                            )
                                        )
                                    }

                                </div>

                            </div>

                        )
                    }

                    <div
                        style={{
                            borderTop:
                                "1px solid var(--border-color)",
                            paddingTop:
                                "1rem",
                            marginTop:
                                "1rem",
                            display:
                                "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "center",
                            gap:
                                "1rem",
                            flexWrap:
                                "wrap"
                        }}
                    >

                        <div
                            className="property-price"
                            style={{
                                fontSize:
                                    "1.4rem"
                            }}
                        >

                            ৳
                            {
                                property.price
                            }

                            <span
                                style={{
                                    fontSize:
                                        "0.85rem",
                                    fontWeight:
                                        "normal",
                                    color:
                                        "var(--text-muted)"
                                }}
                            >
                                {" "}
                                / night
                            </span>

                        </div>


                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() =>
                                alert(
                                    "Booking flow coming soon!"
                                )
                            }
                        >
                            Book Stay
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default PropertyDetails;