import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/profile-property.css";


function Properties() {

    const navigate = useNavigate();

    const [properties, setProperties] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [deletingId, setDeletingId] = useState(null);

    // Edit state
    const [editingProperty, setEditingProperty] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [editImageFiles, setEditImageFiles] = useState([]);
    const [editLoading, setEditLoading] = useState(false);
    const [editMessage, setEditMessage] = useState("");


    /*
    =====================================================
    FETCH HOST PROPERTIES
    =====================================================
    */

    const fetchProperties = async () => {

        try {

            setLoading(true);

            setError("");


            const token =
                localStorage.getItem("token");


            /*
            CHECK LOGIN
            */

            if (!token) {

                navigate("/login");

                return;

            }


            /*
            GET HOST PROPERTIES
            */

            const response = await fetch(

                "http://localhost:5000/api/properties/host/my-properties",

                {
                    method: "GET",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }

            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(

                    data.message ||
                    data.error ||
                    "Failed to fetch properties."

                );

            }


            setProperties(

                Array.isArray(data)
                    ? data
                    : []

            );


        } catch (error) {

            console.error(
                "Fetch host properties error:",
                error
            );


            setError(

                error.message ||
                "Unable to load your properties."

            );


        } finally {

            setLoading(false);

        }

    };


    /*
    =====================================================
    LOAD PROPERTIES
    =====================================================
    */

    useEffect(() => {

        fetchProperties();

    }, []);


    /*
    =====================================================
    ADD PROPERTY
    =====================================================
    */

    const handleAddProperty = () => {

        navigate("/addProperty");

    };


    /*
    =====================================================
    OPEN EDIT FORM
    =====================================================
    */

    const openEditForm = (property) => {
        setEditingProperty(property);
        setEditFormData({
            title: property.title || "",
            description: property.description || "",
            location: property.location || "",
            district: property.district || "",
            property_type: property.property_type || "Apartment",
            price: property.price || "",
            bedrooms: property.bedrooms || 1,
            bathrooms: property.bathrooms || 1,
            maximum_guests: property.maximum_guests || 2,
            amenities: Array.isArray(property.amenities)
                ? property.amenities.join(", ")
                : (property.amenities || "")
        });
        setEditImageFiles([]);
        setEditMessage("");
    };


    /*
    =====================================================
    HANDLE EDIT SUBMIT
    =====================================================
    */

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setEditMessage("");

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            let image_urls = editingProperty.image_urls || [];

            if (editImageFiles.length > 0) {
                const uploadForm = new FormData();
                editImageFiles.forEach((f) => uploadForm.append("images", f));

                const uploadRes = await fetch(
                    "http://localhost:5000/api/properties/upload-images",
                    {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: uploadForm
                    }
                );

                const uploadData = await uploadRes.json();

                if (!uploadRes.ok) {
                    throw new Error(uploadData.message || "Image upload failed.");
                }

                image_urls = uploadData.image_urls;
            }

            const payload = {
                ...editFormData,
                price: parseFloat(editFormData.price),
                bedrooms: parseInt(editFormData.bedrooms, 10),
                bathrooms: parseInt(editFormData.bathrooms, 10),
                maximum_guests: parseInt(editFormData.maximum_guests, 10),
                amenities: editFormData.amenities
                    ? editFormData.amenities.split(",").map((a) => a.trim()).filter(Boolean)
                    : [],
                image_urls
            };

            const res = await fetch(
                `http://localhost:5000/api/properties/${editingProperty.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to update property.");
            }

            setEditMessage("Property updated successfully.");
            await fetchProperties();

            setTimeout(() => {
                setEditingProperty(null);
                setEditMessage("");
            }, 1500);

        } catch (error) {
            setEditMessage(error.message || "Failed to update property.");
        } finally {
            setEditLoading(false);
        }
    };


    /*
    =====================================================
    DELETE VERIFIED PROPERTY
    =====================================================
    */

    const handleDeleteProperty = async (property) => {

        /*
        -----------------------------------------------
        CONFIRMATION
        -----------------------------------------------
        */

        const confirmed =
            window.confirm(

                `Are you sure you want to delete "${property.title}"? This action cannot be undone.`

            );


        if (!confirmed) {

            return;

        }


        try {

            setDeletingId(
                property.id
            );


            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            /*
            -----------------------------------------------
            DELETE PROPERTY
            -----------------------------------------------
            */

            const response = await fetch(

                `http://localhost:5000/api/properties/${property.id}`,

                {

                    method: "DELETE",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }

            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(

                    data.message ||
                    data.error ||
                    "Failed to delete property."

                );

            }


            /*
            -----------------------------------------------
            REMOVE PROPERTY FROM UI
            -----------------------------------------------
            */

            setProperties(
                previousProperties =>
                    previousProperties.filter(
                        item =>
                            item.id !== property.id
                    )
            );


            alert(
                "Property deleted successfully."
            );


        } catch (error) {

            console.error(
                "Delete property error:",
                error
            );


            alert(

                error.message ||
                "Failed to delete property."

            );


        } finally {

            setDeletingId(null);

        }

    };


    /*
    =====================================================
    CANCEL PENDING PROPERTY
    =====================================================
    */

    const handleCancelPendingProperty = async (property) => {

        /*
        -----------------------------------------------
        CONFIRMATION
        -----------------------------------------------
        */

        const confirmed =
            window.confirm(

                `Are you sure you want to cancel "${property.title}"?`

            );


        if (!confirmed) {

            return;

        }


        try {

            setDeletingId(
                property.id
            );


            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            /*
            -----------------------------------------------
            CANCEL PENDING REQUEST
            -----------------------------------------------
            */

            const response = await fetch(

                `http://localhost:5000/api/properties/${property.id}/cancel`,

                {

                    method: "DELETE",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }

            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(

                    data.message ||
                    data.error ||
                    "Failed to cancel property request."

                );

            }


            /*
            -----------------------------------------------
            REMOVE PROPERTY FROM UI
            -----------------------------------------------
            */

            setProperties(
                previousProperties =>
                    previousProperties.filter(
                        item =>
                            item.id !== property.id
                    )
            );


            alert(
                "Property request cancelled successfully."
            );


        } catch (error) {

            console.error(
                "Cancel property error:",
                error
            );


            alert(

                error.message ||
                "Failed to cancel property request."

            );


        } finally {

            setDeletingId(null);

        }

    };


    /*
    =====================================================
    CALCULATE STATISTICS
    =====================================================
    */

    const totalProperties =
        properties.length;


    const pendingProperties =
        properties.filter(

            property =>
                property.verification_status ===
                "pending"

        ).length;


    const verifiedProperties =
        properties.filter(

            property =>
                property.verification_status ===
                "verified"

        ).length;


    const rejectedProperties =
        properties.filter(

            property =>
                property.verification_status ===
                "rejected"

        ).length;


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
                        My Properties
                    </h2>

                    <p>
                        Loading your properties...
                    </p>

                </div>

            </div>

        );

    }


    /*
    =====================================================
    ERROR
    =====================================================
    */

    if (error) {

        return (

            <div className="dashboard-container">

                <div className="ui-card">

                    <h2>
                        My Properties
                    </h2>


                    <p
                        style={{
                            color: "red",
                            marginTop: "1rem"
                        }}
                    >
                        {error}
                    </p>


                    <button

                        className="btn btn-primary"

                        onClick={
                            fetchProperties
                        }

                        style={{
                            marginTop: "20px"
                        }}

                    >

                        Try Again

                    </button>

                </div>

            </div>

        );

    }


    /*
    =====================================================
    MAIN CONTENT
    =====================================================
    */

    return (

        <div
            style={{
                width: "100%"
            }}
        >


            <div className="dashboard-container">


                {/* =================================================
                    PAGE TITLE
                    ================================================= */}

                <div
                    style={{
                        marginBottom:
                            "1.5rem",

                        display:
                            "flex",

                        justifyContent:
                            "space-between",

                        alignItems:
                            "center",

                        gap:
                            "20px",

                        flexWrap:
                            "wrap"
                    }}
                >

                    <div>

                        <h2
                            style={{
                                marginBottom:
                                    "0.4rem"
                            }}
                        >

                            My Properties

                        </h2>


                        <p
                            style={{
                                color:
                                    "var(--text-muted)"
                            }}
                        >

                            Manage your property listings
                            and track their verification
                            status.

                        </p>

                    </div>

                </div>


                {/* =================================================
                    STATISTICS CARDS
                    ================================================= */}

                <div
                    style={{
                        display:
                            "grid",

                        gridTemplateColumns:
                            "repeat(4, minmax(0, 1fr))",

                        gap:
                            "1rem",

                        marginBottom:
                            "2rem"
                    }}
                >


                    {/* TOTAL */}

                    <div
                        className="ui-card"

                        style={{
                            padding:
                                "1.2rem"
                        }}
                    >

                        <p
                            style={{
                                color:
                                    "#6b7280",

                                marginBottom:
                                    "0.4rem"
                            }}
                        >

                            Total Properties

                        </p>


                        <strong
                            style={{
                                fontSize:
                                    "1.8rem",

                                color:
                                    "#111827"
                            }}
                        >

                            {totalProperties}

                        </strong>

                    </div>


                    {/* PENDING */}

                    <div
                        className="ui-card"

                        style={{
                            padding:
                                "1.2rem",

                            background:
                                "#fffbeb",

                            border:
                                "1px solid #fcd34d"
                        }}
                    >

                        <p
                            style={{
                                color:
                                    "#a16207",

                                marginBottom:
                                    "0.4rem",

                                fontWeight:
                                    "600"
                            }}
                        >

                            ⏳ Pending Verification

                        </p>


                        <strong
                            style={{
                                fontSize:
                                    "1.8rem",

                                color:
                                    "#a16207"
                            }}
                        >

                            {pendingProperties}

                        </strong>

                    </div>


                    {/* VERIFIED */}

                    <div
                        className="ui-card"

                        style={{
                            padding:
                                "1.2rem",

                            background:
                                "#ecfdf5",

                            border:
                                "1px solid #86efac"
                        }}
                    >

                        <p
                            style={{
                                color:
                                    "#047857",

                                marginBottom:
                                    "0.4rem",

                                fontWeight:
                                    "600"
                            }}
                        >

                            ✓ Verified & Live

                        </p>


                        <strong
                            style={{
                                fontSize:
                                    "1.8rem",

                                color:
                                    "#047857"
                            }}
                        >

                            {verifiedProperties}

                        </strong>

                    </div>


                    {/* REJECTED */}

                    <div
                        className="ui-card"

                        style={{
                            padding:
                                "1.2rem",

                            background:
                                "#fef2f2",

                            border:
                                "1px solid #fca5a5"
                        }}
                    >

                        <p
                            style={{
                                color:
                                    "#b91c1c",

                                marginBottom:
                                    "0.4rem",

                                fontWeight:
                                    "600"
                            }}
                        >

                            ✕ Rejected

                        </p>


                        <strong
                            style={{
                                fontSize:
                                    "1.8rem",

                                color:
                                    "#b91c1c"
                            }}
                        >

                            {rejectedProperties}

                        </strong>

                    </div>

                </div>


                {/* =================================================
                    PROPERTY LIST
                    ================================================= */}

                {properties.length === 0 ? (

                    <div
                        className="ui-card"

                        style={{
                            textAlign:
                                "center",

                            padding:
                                "4rem 2rem"
                        }}
                    >

                        <h2
                            style={{
                                marginBottom:
                                    "0.8rem"
                            }}
                        >

                            You haven't listed any
                            properties yet.

                        </h2>


                        <p
                            style={{
                                color:
                                    "var(--text-muted)",

                                marginBottom:
                                    "1.8rem"
                            }}
                        >

                            Add your first property
                            to start listing it on
                            Rentify.

                        </p>


                        <button

                            className="btn btn-primary"

                            onClick={
                                handleAddProperty
                            }

                        >

                            + Add Property

                        </button>

                    </div>

                ) : (

                    <>

                        <div
                            style={{
                                display:
                                    "flex",

                                justifyContent:
                                    "space-between",

                                alignItems:
                                    "center",

                                marginBottom:
                                    "1rem",

                                gap:
                                    "15px",

                                flexWrap:
                                    "wrap"
                            }}
                        >

                            <h2
                                style={{
                                    margin:
                                        0
                                }}
                            >

                                Your Properties

                            </h2>


                            {/* ADD ANOTHER PROPERTY */}

                            <button

                                className="btn btn-primary"

                                onClick={
                                    handleAddProperty
                                }

                            >

                                + Add Another Property

                            </button>

                        </div>


                        <div
                            className="property-grid"
                        >

                            {properties.map(
                                (property) => (

                                    <div
                                        key={
                                            property.id
                                        }

                                        className="property-card"

                                        style={{

                                            /*
                                            Different border
                                            depending on status.
                                            */

                                            border:
                                                property.verification_status ===
                                                "verified"

                                                    ? "2px solid #86efac"

                                                    : property.verification_status ===
                                                      "rejected"

                                                        ? "2px solid #fca5a5"

                                                        : "2px solid #fcd34d",

                                            /*
                                            Slight background
                                            difference.
                                            */

                                            background:
                                                property.verification_status ===
                                                "verified"

                                                    ? "#f0fdf4"

                                                    : property.verification_status ===
                                                      "rejected"

                                                        ? "#fffafa"

                                                        : "#fffdf5"

                                        }}
                                    >


                                        {/* =================================================
                                            IMAGE
                                            ================================================= */}

                                        {property.property_images &&
                                        property.property_images.length > 0 ? (

                                            <img

                                                className="property-img"

                                                src={
                                                    property
                                                        .property_images[0]
                                                        .image_url
                                                }

                                                alt={
                                                    property.title
                                                }

                                            />

                                        ) : property.image_urls &&
                                          property.image_urls.length > 0 ? (

                                            <img

                                                className="property-img"

                                                src={
                                                    property.image_urls[0]
                                                }

                                                alt={
                                                    property.title
                                                }

                                            />

                                        ) : (

                                            <div

                                                className="property-img"

                                                style={{
                                                    display:
                                                        "flex",

                                                    alignItems:
                                                        "center",

                                                    justifyContent:
                                                        "center",

                                                    background:
                                                        "#e5e7eb",

                                                    color:
                                                        "#6b7280"
                                                }}

                                            >

                                                No Image

                                            </div>

                                        )}


                                        {/* =================================================
                                            PROPERTY INFORMATION
                                            ================================================= */}

                                        <div
                                            className="property-info"
                                        >

                                            <div>


                                                {/* =================================================
                                                    TYPE + STATUS TAG
                                                    ================================================= */}

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",

                                                        alignItems:
                                                            "center",

                                                        gap:
                                                            "8px",

                                                        flexWrap:
                                                            "wrap"
                                                    }}
                                                >

                                                    {/* PROPERTY TYPE */}

                                                    <span
                                                        className="badge"
                                                    >

                                                        {
                                                            property.property_type
                                                        }

                                                    </span>


                                                    {/* VERIFIED */}

                                                    {property.verification_status ===
                                                        "verified" && (

                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",

                                                                alignItems:
                                                                    "center",

                                                                gap:
                                                                    "5px",

                                                                background:
                                                                    "#16a34a",

                                                                color:
                                                                    "#ffffff",

                                                                border:
                                                                    "1px solid #15803d",

                                                                borderRadius:
                                                                    "999px",

                                                                padding:
                                                                    "5px 10px",

                                                                fontSize:
                                                                    "0.72rem",

                                                                fontWeight:
                                                                    "800",

                                                                letterSpacing:
                                                                    "0.3px"
                                                            }}
                                                        >

                                                            ✓ VERIFIED

                                                        </span>

                                                    )}


                                                    {/* PENDING */}

                                                    {property.verification_status ===
                                                        "pending" && (

                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",

                                                                alignItems:
                                                                    "center",

                                                                gap:
                                                                    "5px",

                                                                background:
                                                                    "#f59e0b",

                                                                color:
                                                                    "#ffffff",

                                                                border:
                                                                    "1px solid #d97706",

                                                                borderRadius:
                                                                    "999px",

                                                                padding:
                                                                    "5px 10px",

                                                                fontSize:
                                                                    "0.72rem",

                                                                fontWeight:
                                                                    "800",

                                                                letterSpacing:
                                                                    "0.3px"
                                                            }}
                                                        >

                                                            ⏳ PENDING

                                                        </span>

                                                    )}


                                                    {/* REJECTED */}

                                                    {property.verification_status ===
                                                        "rejected" && (

                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",

                                                                alignItems:
                                                                    "center",

                                                                gap:
                                                                    "5px",

                                                                background:
                                                                    "#dc2626",

                                                                color:
                                                                    "#ffffff",

                                                                border:
                                                                    "1px solid #b91c1c",

                                                                borderRadius:
                                                                    "999px",

                                                                padding:
                                                                    "5px 10px",

                                                                fontSize:
                                                                    "0.72rem",

                                                                fontWeight:
                                                                    "800",

                                                                letterSpacing:
                                                                    "0.3px"
                                                            }}
                                                        >

                                                            ✕ REJECTED

                                                        </span>

                                                    )}

                                                    {/* LOCKED BY ADMIN */}
                                                    {property.is_locked && (
                                                        <span
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "5px",
                                                                background: "#dc2626",
                                                                color: "#ffffff",
                                                                border: "1px solid #b91c1c",
                                                                borderRadius: "999px",
                                                                padding: "5px 10px",
                                                                fontSize: "0.72rem",
                                                                fontWeight: "800",
                                                                letterSpacing: "0.3px"
                                                            }}
                                                        >
                                                            🔒 LOCKED
                                                        </span>
                                                    )}

                                                </div>


                                                {/* =================================================
                                                    TITLE
                                                    ================================================= */}

                                                <div
                                                    className="property-title"

                                                    style={{
                                                        marginTop:
                                                            "0.5rem"
                                                    }}
                                                >

                                                    {
                                                        property.title
                                                    }

                                                </div>


                                                {/* =================================================
                                                    LOCATION
                                                    ================================================= */}

                                                <div
                                                    style={{
                                                        color:
                                                            "#6b7280",

                                                        marginBottom:
                                                            "10px"
                                                    }}
                                                >

                                                    📍{" "}

                                                    {
                                                        property.district
                                                    }

                                                </div>


                                                {/* =================================================
                                                    PRICE
                                                    ================================================= */}

                                                <div
                                                    className="property-price"
                                                >

                                                    ৳
                                                    {
                                                        property.price
                                                    }

                                                    <span
                                                        style={{
                                                            fontSize:
                                                                "0.8rem",

                                                            color:
                                                                "#6b7280",

                                                            fontWeight:
                                                                "normal"
                                                        }}
                                                    >

                                                        {" "}
                                                        / night

                                                    </span>

                                                </div>


                                                {/* =================================================
                                                    DETAILS
                                                    ================================================= */}

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "10px"
                                                    }}
                                                >

                                                    <span
                                                        className="badge"
                                                    >

                                                        {
                                                            property
                                                                .bedrooms
                                                        }{" "}

                                                        Bedrooms

                                                    </span>


                                                    <span
                                                        className="badge"
                                                    >

                                                        {
                                                            property
                                                                .bathrooms
                                                        }{" "}

                                                        Bathrooms

                                                    </span>


                                                    <span
                                                        className="badge"
                                                    >

                                                        {
                                                            property
                                                                .maximum_guests
                                                        }{" "}

                                                        Guests

                                                    </span>

                                                </div>


                                                {/* =================================================
                                                    AMENITIES
                                                    ================================================= */}

                                                {property.amenities &&
                                                property.amenities.length >
                                                    0 && (

                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "10px"
                                                        }}
                                                    >

                                                        {property.amenities.map(
                                                            (
                                                                amenity,
                                                                index
                                                            ) => (

                                                                <span
                                                                    key={
                                                                        index
                                                                    }

                                                                    className="badge"

                                                                    style={{
                                                                        background:
                                                                            "#f3f4f6",

                                                                        color:
                                                                            "#374151"
                                                                    }}
                                                                >

                                                                    ✓{" "}

                                                                    {
                                                                        amenity
                                                                    }

                                                                </span>

                                                            )
                                                        )}

                                                    </div>

                                                )}


                                                {/* =================================================
                                                    STATUS INFORMATION
                                                    ================================================= */}

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "18px"
                                                    }}
                                                >


                                                    {/* =================================================
                                                        VERIFIED STATUS
                                                        ================================================= */}

                                                    {property.verification_status ===
                                                        "verified" && (

                                                        <div
                                                            style={{
                                                                background:
                                                                    "#dcfce7",

                                                                border:
                                                                    "2px solid #86efac",

                                                                borderRadius:
                                                                    "12px",

                                                                padding:
                                                                    "14px",

                                                                display:
                                                                    "flex",

                                                                alignItems:
                                                                    "center",

                                                                gap:
                                                                    "12px"
                                                            }}
                                                        >

                                                            <div
                                                                style={{
                                                                    width:
                                                                        "38px",

                                                                    height:
                                                                        "38px",

                                                                    borderRadius:
                                                                        "50%",

                                                                    background:
                                                                        "#16a34a",

                                                                    color:
                                                                        "white",

                                                                    display:
                                                                        "flex",

                                                                    alignItems:
                                                                        "center",

                                                                    justifyContent:
                                                                        "center",

                                                                    fontWeight:
                                                                        "bold",

                                                                    fontSize:
                                                                        "1.1rem",

                                                                    flexShrink:
                                                                        0
                                                                }}
                                                            >

                                                                ✓

                                                            </div>


                                                            <div>

                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#166534",

                                                                        fontWeight:
                                                                            "800",

                                                                        fontSize:
                                                                            "1rem"
                                                                    }}
                                                                >

                                                                    Verified & Live

                                                                </div>


                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#15803d",

                                                                        fontSize:
                                                                            "0.8rem",

                                                                        marginTop:
                                                                            "3px"
                                                                    }}
                                                                >

                                                                    This property has been approved by the admin and is visible to guests.

                                                                </div>

                                                            </div>

                                                        </div>

                                                    )}


                                                    {/* =================================================
                                                        PENDING STATUS
                                                        ================================================= */}

                                                    {property.verification_status ===
                                                        "pending" && (

                                                        <div
                                                            style={{
                                                                background:
                                                                    "#fef3c7",

                                                                border:
                                                                    "2px solid #fbbf24",

                                                                borderRadius:
                                                                    "12px",

                                                                padding:
                                                                    "14px",

                                                                display:
                                                                    "flex",

                                                                alignItems:
                                                                    "center",

                                                                gap:
                                                                    "12px"
                                                            }}
                                                        >

                                                            <div
                                                                style={{
                                                                    width:
                                                                        "38px",

                                                                    height:
                                                                        "38px",

                                                                    borderRadius:
                                                                        "50%",

                                                                    background:
                                                                        "#f59e0b",

                                                                    color:
                                                                        "white",

                                                                    display:
                                                                        "flex",

                                                                    alignItems:
                                                                        "center",

                                                                    justifyContent:
                                                                        "center",

                                                                    fontWeight:
                                                                        "bold",

                                                                    fontSize:
                                                                        "1rem",

                                                                    flexShrink:
                                                                        0
                                                                }}
                                                            >

                                                                ⏳

                                                            </div>


                                                            <div>

                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#92400e",

                                                                        fontWeight:
                                                                            "800",

                                                                        fontSize:
                                                                            "1rem"
                                                                    }}
                                                                >

                                                                    Pending Verification

                                                                </div>


                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#a16207",

                                                                        fontSize:
                                                                            "0.8rem",

                                                                        marginTop:
                                                                            "3px"
                                                                    }}
                                                                >

                                                                    Waiting for an admin to review this property.

                                                                </div>

                                                            </div>

                                                        </div>

                                                    )}


                                                    {/* =================================================
                                                        REJECTED STATUS
                                                        ================================================= */}

                                                    {property.verification_status ===
                                                        "rejected" && (

                                                        <div
                                                            style={{
                                                                background:
                                                                    "#fee2e2",

                                                                border:
                                                                    "2px solid #fca5a5",

                                                                borderRadius:
                                                                    "12px",

                                                                padding:
                                                                    "14px",

                                                                display:
                                                                    "flex",

                                                                alignItems:
                                                                    "center",

                                                                gap:
                                                                    "12px"
                                                            }}
                                                        >

                                                            <div
                                                                style={{
                                                                    width:
                                                                        "38px",

                                                                    height:
                                                                        "38px",

                                                                    borderRadius:
                                                                        "50%",

                                                                    background:
                                                                        "#dc2626",

                                                                    color:
                                                                        "white",

                                                                    display:
                                                                        "flex",

                                                                    alignItems:
                                                                        "center",

                                                                    justifyContent:
                                                                        "center",

                                                                    fontWeight:
                                                                        "bold",

                                                                    fontSize:
                                                                        "1.1rem",

                                                                    flexShrink:
                                                                        0
                                                                }}
                                                            >

                                                                !

                                                            </div>


                                                            <div>

                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#991b1b",

                                                                        fontWeight:
                                                                            "800",

                                                                        fontSize:
                                                                            "1rem"
                                                                    }}
                                                                >

                                                                    Property Rejected

                                                                </div>


                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#b91c1c",

                                                                        fontSize:
                                                                            "0.8rem",

                                                                        marginTop:
                                                                            "3px"
                                                                    }}
                                                                >

                                                                    This property was not approved by the admin.

                                                                </div>

                                                            </div>

                                                        </div>

                                                    )}

                                                </div>


                                                {/* =================================================
                                                    ACTIONS
                                                    ================================================= */}

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",

                                                        gap:
                                                            "10px",

                                                        marginTop:
                                                            "15px",

                                                        flexWrap:
                                                            "wrap"
                                                    }}
                                                >


                                                    {/* =================================================
                                                        MANAGE AVAILABILITY (verified property)
                                                        ================================================= */}

                                                    {property.verification_status ===
                                                        "verified" && (

                                                        <button

                                                            className="btn btn-primary"

                                                            onClick={() =>
                                                                navigate(
                                                                    `/properties/${property.id}/availability`
                                                                )
                                                            }

                                                        >

                                                            Manage Availability

                                                        </button>

                                                    )}


                                                    {/* =================================================
                                                        EDIT BUTTON (for all)
                                                        ================================================= */}

                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => openEditForm(property)}
                                                    >
                                                        Edit
                                                    </button>


                                                    {/* =================================================
                                                        VERIFIED PROPERTY DELETE
                                                        ================================================= */}

                                                    {property.verification_status ===
                                                        "verified" && (

                                                        <button

                                                            className="btn btn-danger"

                                                            disabled={
                                                                deletingId ===
                                                                property.id
                                                            }

                                                            onClick={() =>
                                                                handleDeleteProperty(
                                                                    property
                                                                )
                                                            }

                                                        >

                                                            {deletingId ===
                                                            property.id

                                                                ? "Deleting..."

                                                                : "Delete Property"

                                                            }

                                                        </button>

                                                    )}


                                                    {/* =================================================
                                                        PENDING PROPERTY CANCEL
                                                        ================================================= */}

                                                    {property.verification_status ===
                                                        "pending" && (

                                                        <button

                                                            className="btn btn-danger"

                                                            disabled={
                                                                deletingId ===
                                                                property.id
                                                            }

                                                            onClick={() =>
                                                                handleCancelPendingProperty(
                                                                    property
                                                                )
                                                            }

                                                        >

                                                            {deletingId ===
                                                            property.id

                                                                ? "Cancelling..."

                                                                : "Cancel Request"

                                                            }

                                                        </button>

                                                    )}

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    </>

                )}

            </div>

            {/* =================================================
                EDIT MODAL
                ================================================= */}
            {editingProperty && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                    zIndex: 50, display: "flex", alignItems: "center",
                    justifyContent: "center", padding: "1rem"
                }}>
                    <div style={{
                        background: "white", borderRadius: "12px", padding: "2rem",
                        width: "100%", maxWidth: "600px", maxHeight: "90vh",
                        overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                            <h2>Edit Property</h2>
                            <button className="btn btn-secondary" onClick={() => setEditingProperty(null)}>✕</button>
                        </div>

                        {editMessage && (
                            <p style={{
                                color: editMessage.includes("successfully") ? "var(--success-color)" : "var(--danger-color)",
                                marginBottom: "1rem"
                            }}>
                                {editMessage}
                            </p>
                        )}

                        <form onSubmit={handleEditSubmit}>
                            {[
                                { label: "Title", name: "title", type: "text" },
                                { label: "Price per night (৳)", name: "price", type: "number" },
                                { label: "Location", name: "location", type: "text" },
                                { label: "District", name: "district", type: "text" },
                                { label: "Bedrooms", name: "bedrooms", type: "number" },
                                { label: "Bathrooms", name: "bathrooms", type: "number" },
                                { label: "Max Guests", name: "maximum_guests", type: "number" },
                            ].map(({ label, name, type }) => (
                                <div key={name} className="form-group" style={{ marginBottom: "0.75rem" }}>
                                    <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>{label}</label>
                                    <input
                                        type={type}
                                        value={editFormData[name] || ""}
                                        onChange={(e) => setEditFormData((prev) => ({ ...prev, [name]: e.target.value }))}
                                        required
                                        style={{ width: "100%", padding: "8px", border: "1px solid var(--border-color)", borderRadius: "6px" }}
                                    />
                                </div>
                            ))}

                            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>Description</label>
                                <textarea
                                    value={editFormData.description || ""}
                                    onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    style={{ width: "100%", padding: "8px", border: "1px solid var(--border-color)", borderRadius: "6px" }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>Property Type</label>
                                <select
                                    value={editFormData.property_type || "Apartment"}
                                    onChange={(e) => setEditFormData((prev) => ({ ...prev, property_type: e.target.value }))}
                                    style={{ width: "100%", padding: "8px", border: "1px solid var(--border-color)", borderRadius: "6px" }}
                                >
                                    {["Apartment","House","Villa","Studio","Condo","Duplex"].map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>Amenities (comma-separated)</label>
                                <input
                                    type="text"
                                    value={editFormData.amenities || ""}
                                    onChange={(e) => setEditFormData((prev) => ({ ...prev, amenities: e.target.value }))}
                                    placeholder="WiFi, AC, Parking"
                                    style={{ width: "100%", padding: "8px", border: "1px solid var(--border-color)", borderRadius: "6px" }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>Replace Images (optional)</label>
                                <input
                                    type="file" accept="image/*" multiple
                                    onChange={(e) => setEditImageFiles(Array.from(e.target.files).slice(0, 8))}
                                />
                                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                    Leave empty to keep existing images.
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                                    {editLoading ? "Saving..." : "Save Changes"}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingProperty(null)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );

}


export default Properties;