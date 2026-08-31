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

    const [refunds, setRefunds] = useState([]);


    {/*
    =====================================================
    LOAD BOOKINGS
    =====================================================
    */}

    const fetchBookings = async () => {

        try {

            setLoading(true);

            setError("");

            const token = localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            {/*
            ==============================================
            GET BOOKINGS
            ==============================================
            */}

            const bookingsResponse = await fetch(
                `${API_BASE}/bookings/my-bookings`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );


            const bookingsData =
                await bookingsResponse.json();


            if (!bookingsResponse.ok) {

                throw new Error(
                    bookingsData.message ||
                    "Failed to load your bookings."
                );

            }


            setBookings(
                Array.isArray(bookingsData)
                    ? bookingsData
                    : []
            );


            {/*
            ==============================================
            GET REFUND HISTORY

            Refunds are stored in wallet_transactions,
            so we retrieve them from the existing wallet
            transaction endpoint.
            ==============================================
            */}

            const transactionsResponse = await fetch(
                `${API_BASE}/wallet/transactions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );


            if (transactionsResponse.ok) {

                const transactionsData =
                    await transactionsResponse.json();


                const refundTransactions =
                    Array.isArray(transactionsData)
                        ? transactionsData.filter(
                            (transaction) =>
                                transaction.type === "refund" &&
                                transaction.related_entity_type === "booking"
                        )
                        : [];


                setRefunds(refundTransactions);

            } else {

                setRefunds([]);

            }


        } catch (error) {

            console.error(
                "Fetch my bookings error:",
                error
            );

            setError(
                error.message ||
                "Unable to load your bookings."
            );

        } finally {

            setLoading(false);

        }

    };


    {/*
    =====================================================
    INITIAL LOAD
    =====================================================
    */}

    useEffect(() => {

        fetchBookings();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    {/*
    =====================================================
    CANCEL BOOKING
    =====================================================
    */}

    const handleCancelBooking = async (booking) => {

        const propertyTitle =
            booking.properties?.title ||
            "this property";


        const confirmed = window.confirm(

            `Cancel your booking for "${propertyTitle}"?\n\n` +

            `A refund of ৳${Number(
                booking.total_price
            ).toFixed(2)} will be returned to your wallet.`

        );


        if (!confirmed) {

            return;

        }


        try {

            setCancellingId(booking.id);


            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            const response = await fetch(

                `${API_BASE}/bookings/${booking.id}/cancel`,

                {
                    method: "PUT",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }

            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(

                    data.message ||
                    "Failed to cancel booking."

                );

            }


            {/*
            ==============================================
            UPDATE BOOKING STATUS LOCALLY
            ==============================================
            */}

            setBookings((previous) =>

                previous.map((item) =>

                    item.id === booking.id

                        ? {
                            ...item,
                            status: "cancelled"
                        }

                        : item

                )

            );


            {/*
            ==============================================
            ADD REFUND TO LOCAL STATE
            ==============================================
            */}

            if (data.refund) {

                const newRefund = {

                    id: `temporary-${booking.id}`,

                    related_entity_id: booking.id,

                    related_entity_type: "booking",

                    type: "refund",

                    amount: Number(
                        data.refund.amount
                    ),

                    created_at:
                        new Date().toISOString()

                };


                setRefunds((previous) => [

                    newRefund,

                    ...previous

                ]);

            }


            {/*
            ==============================================
            SUCCESS MESSAGE
            ==============================================
            */}

            alert(

                `Booking cancelled successfully.\n\n` +

                `Refund of ৳${Number(
                    data.refund?.amount ||
                    booking.total_price
                ).toFixed(2)} has been added to your wallet.`

            );


            {/*
            ==============================================
            RELOAD DATA

            This makes sure the displayed wallet/refund
            information matches Supabase.
            ==============================================
            */}

            await fetchBookings();


        } catch (error) {

            console.error(
                "Cancel booking error:",
                error
            );

            alert(
                error.message ||
                "Failed to cancel booking."
            );

        } finally {

            setCancellingId(null);

        }

    };


    {/*
    =====================================================
    LOADING
    =====================================================
    */}

    if (loading) {

        return (

            <div className="dashboard-container">

                Loading your bookings...

            </div>

        );

    }


    {/*
    =====================================================
    PAGE
    =====================================================
    */}

    return (

        <div className="dashboard-container">

            <div className="ui-card">

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/dashboard")}
                    style={{
                        marginBottom: "1rem"
                    }}
                >
                    ← Back to Dashboard
                </button>


                <h2>My Bookings</h2>


                {error && (

                    <p
                        style={{
                            color:
                                "var(--danger-color)"
                        }}
                    >
                        {error}
                    </p>

                )}


                {!error &&
                    bookings.length === 0 && (

                        <p
                            style={{
                                color:
                                    "var(--text-muted)"
                            }}
                        >
                            You haven't booked any
                            properties yet.
                        </p>

                    )}


                {!error &&
                    bookings.map((booking) => {


                        const propertyInfo =
                            booking.properties ||
                            {};


                        const image =
                            propertyInfo
                                .image_urls?.[0] ||
                            FALLBACK_IMAGE;


                        {/*
                        ==========================================
                        FIND REFUND FOR THIS BOOKING
                        ==========================================
                        */}

                        const refund =
                            refunds.find(

                                (item) =>
                                    item.related_entity_id ===
                                    booking.id

                            );


                        return (

                            <div
                                key={booking.id}
                                className="booking-list-item"
                            >

                                <img
                                    src={image}
                                    alt={
                                        propertyInfo.title ||
                                        "Property"
                                    }
                                />


                                <div
                                    className="booking-list-item-details"
                                >


                                    <div
                                        style={{
                                            display:
                                                "flex",

                                            alignItems:
                                                "center",

                                            gap:
                                                "0.6rem",

                                            marginBottom:
                                                "0.35rem"
                                        }}
                                    >

                                        <strong
                                            style={{
                                                cursor:
                                                    propertyInfo.id
                                                        ? "pointer"
                                                        : "default"
                                            }}

                                            onClick={() =>
                                                propertyInfo.id &&
                                                navigate(
                                                    `/properties/${propertyInfo.id}`
                                                )
                                            }
                                        >
                                            {
                                                propertyInfo.title ||
                                                "Property no longer available"
                                            }
                                        </strong>


                                        <span
                                            className={
                                                `booking-status-badge ${booking.status}`
                                            }
                                        >
                                            {booking.status}
                                        </span>

                                    </div>


                                    <p
                                        style={{
                                            color:
                                                "var(--text-muted)",

                                            fontSize:
                                                "0.85rem"
                                        }}
                                    >

                                        📍{" "}
                                        {propertyInfo.location}

                                        {
                                            propertyInfo.district
                                                ? ` — ${propertyInfo.district}`
                                                : ""
                                        }

                                    </p>


                                    <p
                                        style={{
                                            fontSize:
                                                "0.9rem",

                                            margin:
                                                "0.4rem 0"
                                        }}
                                    >

                                        <strong>
                                            {booking.check_in}
                                        </strong>

                                        {" → "}

                                        <strong>
                                            {booking.check_out}
                                        </strong>

                                        {" "}·{" "}

                                        {booking.nights}

                                        {" "}

                                        night
                                        {
                                            booking.nights > 1
                                                ? "s"
                                                : ""
                                        }

                                        {" "}·{" "}

                                        {booking.guests}

                                        {" "}

                                        guest
                                        {
                                            booking.guests > 1
                                                ? "s"
                                                : ""
                                        }

                                    </p>


                                    <p
                                        style={{
                                            fontWeight:
                                                700
                                        }}
                                    >
                                        Total: ৳
                                        {booking.total_price}
                                    </p>


                                    {/*
                                    ==================================
                                    REFUND INFORMATION
                                    ==================================
                                    */}

                                    {refund && (

                                        <div
                                            style={{
                                                marginTop:
                                                    "0.75rem",

                                                padding:
                                                    "0.85rem",

                                                borderRadius:
                                                    "8px",

                                                border:
                                                    "1px solid var(--success-color)",

                                                background:
                                                    "var(--success-bg, #eaf8ef)"
                                            }}
                                        >

                                            <strong>
                                                Refund Processed
                                            </strong>


                                            <p
                                                style={{
                                                    margin:
                                                        "0.3rem 0 0"
                                                }}
                                            >

                                                ৳
                                                {Number(
                                                    Math.abs(
                                                        refund.amount
                                                    )
                                                ).toFixed(2)}

                                                {" "}
                                                has been returned
                                                to your wallet.

                                            </p>


                                            <small
                                                style={{
                                                    color:
                                                        "var(--text-muted)"
                                                }}
                                            >

                                                Refund date:{" "}

                                                {
                                                    new Date(
                                                        refund.created_at
                                                    ).toLocaleDateString()
                                                }

                                            </small>

                                        </div>

                                    )}


                                    {/*
                                    ==================================
                                    CANCEL BUTTON
                                    ==================================
                                    */}

                                    {booking.status ===
                                        "confirmed" && (

                                        <button
                                            type="button"

                                            className="btn btn-danger"

                                            disabled={
                                                cancellingId ===
                                                booking.id
                                            }

                                            onClick={() =>
                                                handleCancelBooking(
                                                    booking
                                                )
                                            }

                                            style={{
                                                marginTop:
                                                    "0.5rem"
                                            }}
                                        >

                                            {
                                                cancellingId ===
                                                booking.id

                                                    ? "Cancelling…"

                                                    : "Cancel Booking"
                                            }

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