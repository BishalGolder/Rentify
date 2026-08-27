import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


import "../styles/profile-property.css";
import "../styles/booking.css";


const API_BASE = "http://localhost:5000/api";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6";


function MyBookings() {

    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState(null);


    const fetchBookings = async () => {

        try {

            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch(`${API_BASE}/bookings/my-bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Failed to load your bookings."
                );

            }

            setBookings(Array.isArray(data) ? data : []);

        } catch (error) {

            console.error("Fetch my bookings error:", error);

            setError(
                error.message || "Unable to load your bookings."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        fetchBookings();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleCancelBooking = async (booking) => {

        const confirmed = window.confirm(
            `Cancel your booking for "${booking.properties?.title || "this property"}"?`
        );

        if (!confirmed) return;

        try {

            setCancellingId(booking.id);

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch(
                `${API_BASE}/bookings/${booking.id}/cancel`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Failed to cancel booking."
                );

            }

            setBookings((previous) =>
                previous.map((item) =>
                    item.id === booking.id
                        ? { ...item, status: "cancelled" }
                        : item
                )
            );

            alert("Booking cancelled successfully.");

        } catch (error) {

            console.error("Cancel booking error:", error);

            alert(error.message || "Failed to cancel booking.");

        } finally {

            setCancellingId(null);

        }

    };


    return (
        <div className="dashboard-container">
            <div className="ui-card">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/dashboard")}
                    style={{ marginBottom: "1rem" }}
                >
                    ← Back to Dashboard
                </button>
 
                <h2>My Bookings</h2>


                {loading && <p>Loading your bookings…</p>}

                {!loading && error && (
                    <p style={{ color: "var(--danger-color)" }}>{error}</p>
                )}

                {!loading && !error && bookings.length === 0 && (

                    <p style={{ color: "var(--text-muted)" }}>
                        You haven't booked any properties yet.
                    </p>

                )}

                {!loading && !error && bookings.map((booking) => {

                    const propertyInfo = booking.properties || {};

                    const image =
                        propertyInfo.image_urls?.[0] || FALLBACK_IMAGE;

                    return (

                        <div key={booking.id} className="booking-list-item">

                            <img src={image} alt={propertyInfo.title || "Property"} />

                            <div className="booking-list-item-details">

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                        marginBottom: "0.35rem"
                                    }}
                                >

                                    <strong
                                        style={{
                                            cursor: propertyInfo.id ? "pointer" : "default"
                                        }}
                                        onClick={() =>
                                            propertyInfo.id &&
                                            navigate(`/properties/${propertyInfo.id}`)
                                        }
                                    >
                                        {propertyInfo.title || "Property no longer available"}
                                    </strong>

                                    <span className={`booking-status-badge ${booking.status}`}>
                                        {booking.status}
                                    </span>

                                </div>

                                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                    📍 {propertyInfo.location}
                                    {propertyInfo.district ? ` — ${propertyInfo.district}` : ""}
                                </p>

                                <p style={{ fontSize: "0.9rem", margin: "0.4rem 0" }}>
                                    <strong>{booking.check_in}</strong> → <strong>{booking.check_out}</strong>
                                    {" "}· {booking.nights} night{booking.nights > 1 ? "s" : ""}
                                    {" "}· {booking.guests} guest{booking.guests > 1 ? "s" : ""}
                                </p>

                                <p style={{ fontWeight: 700 }}>
                                    Total: ৳{booking.total_price}
                                </p>

                                {booking.status === "confirmed" && (

                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        disabled={cancellingId === booking.id}
                                        onClick={() => handleCancelBooking(booking)}
                                        style={{ marginTop: "0.5rem" }}
                                    >
                                        {cancellingId === booking.id ? "Cancelling…" : "Cancel Booking"}
                                    </button>

                                )}

                            </div>

                        </div>

                    );

                })}

            </div>

        </div>

    );

}


export default MyBookings;