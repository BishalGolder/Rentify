import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { addRecentlyViewed } from "../hooks/useRecentlyViewed";
import BookingModal from "../components/bookingModal";

import "../styles/profile-property.css";
import "../styles/booking.css";


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

    const [showBookingModal, setShowBookingModal] =
        useState(false);


    // Reviews
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMessage, setReviewMessage] = useState("");

    const [eligibleBookingId, setEligibleBookingId] =
        useState(null);

    const [canReview, setCanReview] =
        useState(false);


    // Reporting System
    const [showReportForm, setShowReportForm] =
        useState(false);

    const [reportCategory, setReportCategory] =
        useState("fraudulent_listing");

    const [reportDescription, setReportDescription] =
        useState("");

    const [submittingReport, setSubmittingReport] =
        useState(false);

    const [reportMessage, setReportMessage] =
        useState("");


    const storedUser =
        JSON.parse(localStorage.getItem("user") || "null");


    useEffect(() => {

        fetchProperty();
        fetchReviews();
        checkReviewEligibility();

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


    const fetchReviews = async () => {

        try {

            setReviewsLoading(true);

            const res =
                await fetch(
                    `http://localhost:5000/api/reviews/property/${id}`
                );


            if (res.ok) {

                const data =
                    await res.json();

                setReviews(data);

            } else {

                console.error(
                    "Failed to load reviews"
                );

            }

        } catch (error) {

            console.error(
                "Review loading error:",
                error
            );

        } finally {

            setReviewsLoading(false);

        }

    };


    const checkReviewEligibility = async () => {

        try {

            const token =
                localStorage.getItem("token");


            if (!token) {

                setCanReview(false);
                setEligibleBookingId(null);

                return;

            }


            const res =
                await fetch(
                    `http://localhost:5000/api/reviews/eligible/${id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await res.json();


            if (
                res.ok &&
                data.eligible
            ) {

                setCanReview(true);

                setEligibleBookingId(
                    data.booking_id
                );

            } else {

                setCanReview(false);

                setEligibleBookingId(null);

            }

        } catch (error) {

            console.error(
                "Eligibility check error:",
                error
            );

            setCanReview(false);

            setEligibleBookingId(null);

        }

    };


    const handleBackToDashboard = () => {

        navigate("/dashboard");

    };


    const handleReviewSubmit = async (e) => {

        e.preventDefault();

        try {

            setSubmittingReview(true);

            setReviewMessage("");


            const token =
                localStorage.getItem("token");


            if (!token) {

                setReviewMessage(
                    "Please login first."
                );

                return;

            }


            if (!comment.trim()) {

                setReviewMessage(
                    "Please write a review."
                );

                return;

            }


            const response =
                await fetch(
                    "http://localhost:5000/api/reviews",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({

                            property_id:
                                id,

                            rating:
                                Number(rating),

                            comment:
                                comment.trim()

                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Review submission failed."
                );

            }


            setReviewMessage(
                "Review submitted successfully!"
            );

            setComment("");

            setRating(5);


            await fetchReviews();

            await fetchProperty();

            await checkReviewEligibility();


        } catch (error) {

            console.error(
                "Review submission error:",
                error
            );

            setReviewMessage(
                error.message ||
                "Review submission failed."
            );

        } finally {

            setSubmittingReview(false);

        }

    };


    const handleReportSubmit = async (e) => {

        e.preventDefault();

        try {

            setSubmittingReport(true);

            setReportMessage("");


            const token =
                localStorage.getItem("token");


            if (!token) {

                setReportMessage(
                    "Please login before submitting a report."
                );

                return;

            }


            if (!reportDescription.trim()) {

                setReportMessage(
                    "Please describe the reason for your report."
                );

                return;

            }


            const response =
                await fetch(
                    "http://localhost:5000/api/reports",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({

                            property_id:
                                id,

                            category:
                                reportCategory,

                            description:
                                reportDescription.trim()

                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Report submission failed."
                );

            }


            setReportMessage(
                "Report submitted successfully. Our admin team will review it."
            );

            setReportDescription("");

            setReportCategory(
                "fraudulent_listing"
            );


        } catch (error) {

            console.error(
                "Report submission error:",
                error
            );

            setReportMessage(
                error.message ||
                "Report submission failed."
            );

        } finally {

            setSubmittingReport(false);

        }

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


                        {/* =========================================
                            BOOK STAY + CHAT WITH HOST
                        ========================================= */}

                        {(() => {

                            const currentUser =
                                JSON.parse(
                                    localStorage.getItem(
                                        "user"
                                    ) || "null"
                                );


                            const isHostOrAdmin =
                                currentUser &&
                                ["host", "admin"].includes(
                                    currentUser.role
                                );


                            if (isHostOrAdmin) {

                                return null;

                            }


                            return (

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        alignItems: "center",
                                        flexWrap: "wrap"
                                    }}
                                >

                                    {/* BOOK STAY */}

                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {

                                            const token =
                                                localStorage.getItem(
                                                    "token"
                                                );


                                            if (!token) {

                                                alert(
                                                    "Please login as a guest to book this property."
                                                );

                                                navigate(
                                                    "/login"
                                                );

                                                return;

                                            }


                                            setShowBookingModal(
                                                true
                                            );

                                        }}
                                    >
                                        Book Stay
                                    </button>


                                    {/* CHAT WITH HOST */}

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {

                                            const token =
                                                localStorage.getItem(
                                                    "token"
                                                );


                                            if (!token) {

                                                alert(
                                                    "Please login as a guest to chat with the host."
                                                );

                                                navigate(
                                                    "/login"
                                                );

                                                return;

                                            }


                                            if (
                                                currentUser?.role !==
                                                "guest"
                                            ) {

                                                alert(
                                                    "Only guests can start a conversation with a host."
                                                );

                                                return;

                                            }


                                            navigate(
                                                `/chat?propertyId=${property.id}`
                                            );

                                        }}
                                    >
                                        💬 Chat with Host
                                    </button>

                                </div>

                            );

                        })()}

                    </div>


                    {/* =========================================
                        REPORTING SECTION
                    ========================================= */}

                    <div
                        style={{
                            borderTop:
                                "1px solid var(--border-color)",

                            marginTop:
                                "2rem",

                            paddingTop:
                                "1.5rem"
                        }}
                    >

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {

                                setShowReportForm(
                                    !showReportForm
                                );

                                setReportMessage("");

                            }}
                        >
                            ⚑ Report this property
                        </button>


                        {showReportForm && (

                            <form
                                onSubmit={
                                    handleReportSubmit
                                }
                                style={{
                                    marginTop:
                                        "1rem",

                                    padding:
                                        "1rem",

                                    border:
                                        "1px solid var(--border-color)",

                                    borderRadius:
                                        "8px"
                                }}
                            >

                                <h4>
                                    Report Property
                                </h4>


                                <label>
                                    Reason
                                </label>


                                <select
                                    value={
                                        reportCategory
                                    }
                                    onChange={(e) =>
                                        setReportCategory(
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        marginTop: "0.5rem",
                                        marginBottom: "1rem"
                                    }}
                                >

                                    <option value="fraudulent_listing">
                                        Fraudulent Listing
                                    </option>

                                    <option value="inappropriate_content">
                                        Inappropriate Content
                                    </option>

                                    <option value="policy_violation">
                                        Policy Violation
                                    </option>

                                    <option value="other">
                                        Other
                                    </option>

                                </select>


                                <label>
                                    Description
                                </label>


                                <textarea
                                    value={
                                        reportDescription
                                    }
                                    onChange={(e) =>
                                        setReportDescription(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Explain why you are reporting this property..."
                                    required
                                    style={{
                                        width: "100%",
                                        minHeight: "100px",
                                        padding: "10px",
                                        marginTop: "0.5rem",
                                        boxSizing: "border-box"
                                    }}
                                />


                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        marginTop: "0.75rem",
                                        flexWrap: "wrap"
                                    }}
                                >

                                    <button
                                        type="submit"
                                        className="btn btn-danger"
                                        disabled={
                                            submittingReport
                                        }
                                    >
                                        {
                                            submittingReport
                                                ? "Submitting..."
                                                : "Submit Report"
                                        }
                                    </button>


                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {

                                            setShowReportForm(
                                                false
                                            );

                                            setReportMessage("");

                                            setReportDescription("");

                                            setReportCategory(
                                                "fraudulent_listing"
                                            );

                                        }}
                                    >
                                        Cancel
                                    </button>

                                </div>


                                {reportMessage && (

                                    <p
                                        style={{
                                            marginTop:
                                                "0.75rem"
                                        }}
                                    >
                                        {
                                            reportMessage
                                        }
                                    </p>

                                )}

                            </form>

                        )}

                    </div>


                    {/* =========================================
                        REVIEWS SECTION
                    ========================================= */}

                    <div
                        style={{
                            borderTop:
                                "1px solid var(--border-color)",

                            marginTop:
                                "2rem",

                            paddingTop:
                                "1.5rem"
                        }}
                    >

                        <h3>
                            Guest Reviews
                        </h3>


                        {canReview && (

                            <form
                                onSubmit={
                                    handleReviewSubmit
                                }
                                style={{
                                    margin:
                                        "1rem 0 1.5rem 0",

                                    padding:
                                        "1rem",

                                    border:
                                        "1px solid var(--border-color)",

                                    borderRadius:
                                        "8px"
                                }}
                            >

                                <h4>
                                    Write a Review
                                </h4>


                                <label>
                                    Rating:
                                </label>


                                <select
                                    value={rating}
                                    onChange={(e) =>
                                        setRating(
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        marginLeft:
                                            "10px",

                                        padding:
                                            "8px"
                                    }}
                                >

                                    <option value="5">
                                        ⭐⭐⭐⭐⭐
                                    </option>

                                    <option value="4">
                                        ⭐⭐⭐⭐
                                    </option>

                                    <option value="3">
                                        ⭐⭐⭐
                                    </option>

                                    <option value="2">
                                        ⭐⭐
                                    </option>

                                    <option value="1">
                                        ⭐
                                    </option>

                                </select>


                                <textarea
                                    value={comment}
                                    onChange={(e) =>
                                        setComment(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Write about your stay..."
                                    required
                                    style={{
                                        width: "100%",
                                        minHeight: "100px",
                                        marginTop: "1rem",
                                        padding: "10px",
                                        boxSizing: "border-box"
                                    }}
                                />


                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        submittingReview
                                    }
                                    style={{
                                        marginTop:
                                            "0.75rem"
                                    }}
                                >
                                    {
                                        submittingReview
                                            ? "Submitting..."
                                            : "Submit Review"
                                    }
                                </button>


                                {reviewMessage && (

                                    <p
                                        style={{
                                            marginTop:
                                                "0.75rem"
                                        }}
                                    >
                                        {
                                            reviewMessage
                                        }
                                    </p>

                                )}

                            </form>

                        )}


                        {reviewsLoading ? (

                            <p>
                                Loading reviews...
                            </p>

                        ) : reviews.length === 0 ? (

                            <p
                                style={{
                                    color:
                                        "var(--text-muted)"
                                }}
                            >
                                No reviews yet.
                            </p>

                        ) : (

                            reviews.map(
                                (review) => (

                                    <div
                                        key={
                                            review.id
                                        }
                                        style={{
                                            padding:
                                                "1rem 0",

                                            borderBottom:
                                                "1px solid var(--border-color)"
                                        }}
                                    >

                                        <div>
                                            ⭐{" "}
                                            {
                                                review.rating
                                            }
                                            /5
                                        </div>


                                        <p>
                                            {
                                                review.comment
                                            }
                                        </p>


                                        <small
                                            style={{
                                                color:
                                                    "var(--text-muted)"
                                            }}
                                        >
                                            {
                                                new Date(
                                                    review.created_at
                                                ).toLocaleDateString()
                                            }
                                        </small>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </div>

            </div>


            {showBookingModal && (

                <BookingModal
                    property={property}
                    onClose={() =>
                        setShowBookingModal(false)
                    }
                />

            )}

        </div>

    );

}


export default PropertyDetails;