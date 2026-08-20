import { useNavigate } from "react-router-dom";

import {
    useCompare
} from "../context/CompareContext";

import "../styles/profile-property.css";


const ROWS = [

    {
        label: "Price / night",
        get: (p) =>
            `$${p.price}`
    },

    {
        label: "Property Type",
        get: (p) =>
            p.property_type || "-"
    },

    {
        label: "Location",
        get: (p) =>
            p.location || "-"
    },

    {
        label: "District",
        get: (p) =>
            p.district || "-"
    },

    {
        label: "Rating",
        get: (p) =>
            p.average_rating ??
            p.rating ??
            "No ratings yet"
    },

    {
        label: "Bedrooms",
        get: (p) =>
            p.bedrooms ?? "-"
    },

    {
        label: "Bathrooms",
        get: (p) =>
            p.bathrooms ?? "-"
    },

    {
        label: "Max Guests",
        get: (p) =>
            p.maximum_guests ??
            p.guests ??
            "-"
    },

    {
        label: "Amenities",
        get: (p) =>
            p.amenities?.length
                ? p.amenities.join(", ")
                : "None listed"
    },

    {
        label: "Status",
        get: (p) =>
            p.verification_status === "verified"
                ? "Available"
                : p.verification_status ||
                  "Available"
    }

];


function Compare() {

    const {
        compareList,
        clearCompare
    } = useCompare();

    const navigate =
        useNavigate();


    const handleBackToDashboard = () => {

        navigate("/dashboard");

    };


    if (
        compareList.length < 2
    ) {

        return (

            <div className="dashboard-container">

                <div
                    className="ui-card"
                    style={{
                        textAlign: "center"
                    }}
                >

                    <h2>
                        Compare Properties
                    </h2>


                    <p
                        style={{
                            marginTop: "1rem",
                            color:
                                "var(--text-muted)"
                        }}
                    >
                        Select at least 2
                        properties from the
                        marketplace to compare
                        them.
                    </p>


                    <button
                        className="btn btn-primary"
                        style={{
                            marginTop: "1.5rem"
                        }}
                        onClick={
                            handleBackToDashboard
                        }
                    >
                        ← Back to Search
                    </button>

                </div>

            </div>

        );

    }


    return (

        <div className="dashboard-container">

            <div
                className="ui-card"
                style={{
                    overflowX: "auto"
                }}
            >

                {/* HEADER */}

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        gap: "1rem",
                        flexWrap: "wrap"
                    }}
                >

                    <h2>
                        Compare Properties
                    </h2>


                    <button
                        className="btn btn-secondary"
                        onClick={
                            clearCompare
                        }
                    >
                        Clear All
                    </button>

                </div>


                <table
                    style={{
                        width: "100%",
                        borderCollapse:
                            "collapse",
                        marginTop: "1rem"
                    }}
                >

                    <thead>

                        <tr>

                            <th
                                style={{
                                    textAlign:
                                        "left",
                                    padding:
                                        "0.75rem",
                                    borderBottom:
                                        "2px solid var(--border-color)"
                                }}
                            >
                            </th>


                            {compareList.map(
                                (p) => (

                                    <th
                                        key={
                                            p.id ||
                                            p.property_id
                                        }
                                        style={{
                                            padding:
                                                "0.75rem",
                                            borderBottom:
                                                "2px solid var(--border-color)",
                                            minWidth:
                                                "200px"
                                        }}
                                    >

                                        <img
                                            src={
                                                p.image_urls?.[0] ||
                                                p.image ||
                                                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"
                                            }
                                            alt={
                                                p.title
                                            }
                                            style={{
                                                width:
                                                    "100%",
                                                height:
                                                    "120px",
                                                objectFit:
                                                    "cover",
                                                borderRadius:
                                                    "8px"
                                            }}
                                        />


                                        <div
                                            style={{
                                                marginTop:
                                                    "0.5rem"
                                            }}
                                        >
                                            {
                                                p.title
                                            }
                                        </div>


                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                marginTop:
                                                    "0.5rem",
                                                fontSize:
                                                    "0.8rem",
                                                padding:
                                                    "0.4rem 0.8rem"
                                            }}
                                            onClick={() =>
                                                navigate(
                                                    `/properties/${
                                                        p.id ||
                                                        p.property_id
                                                    }`
                                                )
                                            }
                                        >
                                            View
                                        </button>

                                    </th>

                                )
                            )}

                        </tr>

                    </thead>


                    <tbody>

                        {ROWS.map(
                            (row) => (

                                <tr
                                    key={
                                        row.label
                                    }
                                >

                                    <td
                                        style={{
                                            padding:
                                                "0.75rem",
                                            fontWeight:
                                                "bold",
                                            borderBottom:
                                                "1px solid var(--border-color)",
                                            color:
                                                "var(--text-muted)"
                                        }}
                                    >
                                        {
                                            row.label
                                        }
                                    </td>


                                    {compareList.map(
                                        (p) => (

                                            <td
                                                key={
                                                    (
                                                        p.id ||
                                                        p.property_id
                                                    ) +
                                                    row.label
                                                }
                                                style={{
                                                    padding:
                                                        "0.75rem",
                                                    borderBottom:
                                                        "1px solid var(--border-color)",
                                                    textAlign:
                                                        "center"
                                                }}
                                            >
                                                {
                                                    row.get(
                                                        p
                                                    )
                                                }
                                            </td>

                                        )
                                    )}

                                </tr>

                            )
                        )}

                    </tbody>

                </table>


                {/* BACK TO SEARCH */}

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "center",
                        marginTop: "2rem"
                    }}
                >

                    <button
                        className="btn btn-secondary"
                        onClick={
                            handleBackToDashboard
                        }
                    >
                        ← Back to Search
                    </button>

                </div>

            </div>

        </div>

    );

}


export default Compare;