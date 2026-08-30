import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AvailabilityCalendar, { todayDateString } from "./availabilityCalendar";

import "../styles/booking.css";


const API_BASE = "http://localhost:5000/api";


function BookingModal({ property, onClose, onBookingSuccess }) {

    const navigate = useNavigate();

    const [loadingAvailability, setLoadingAvailability] = useState(true);
    const [availabilityError, setAvailabilityError] = useState("");

    const [bookedRanges, setBookedRanges] = useState([]);
    const [blockedRanges, setBlockedRanges] = useState([]);

    const [selection, setSelection] = useState({ checkIn: null, checkOut: null, dayCount: 0 });
    const [guests, setGuests] = useState(1);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");

    // New state for wallet balance
    const [walletBalance, setWalletBalance] = useState(null);


    /*
    =====================================================
    LOAD AVAILABILITY AND WALLET BALANCE
    =====================================================
    */

    useEffect(() => {

        const fetchAvailabilityAndBalance = async () => {

            setLoadingAvailability(true);
            setAvailabilityError("");

            try {

                // 1. Fetch availability
                const availabilityResponse = await fetch(
                    `${API_BASE}/bookings/availability/${property.id}`
                );

                const availabilityData = await availabilityResponse.json();

                if (!availabilityResponse.ok) {

                    throw new Error(
                        availabilityData.message || "Failed to load availability."
                    );

                }

                setBookedRanges(
                    (availabilityData.bookedRanges || []).map((range) => ({
                        start: range.check_in,
                        end: range.check_out
                    }))
                );

                setBlockedRanges(
                    (availabilityData.blockedRanges || []).map((block) => ({
                        start: block.start_date,
                        end: block.end_date
                    }))
                );

                // 2. Fetch wallet balance (if logged in)
                const token = localStorage.getItem("token");
                if (token) {
                    const profileRes = await fetch(`${API_BASE}/profiles/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (profileRes.ok) {
                        const profile = await profileRes.json();
                        setWalletBalance(profile.wallet_balance ?? 0);
                    } else {
                        // If profile fetch fails, we don't block booking; just set balance to null
                        setWalletBalance(null);
                    }
                }

            } catch (error) {

                console.error("Load availability/balance error:", error);

                setAvailabilityError(
                    error.message || "Failed to load availability for this property."
                );

            } finally {

                setLoadingAvailability(false);

            }

        };

        fetchAvailabilityAndBalance();

    }, [property.id]);


    /*
    =====================================================
    PRICE CALCULATION
    =====================================================
    */

    const days = selection.dayCount || 0;

    const totalPrice = days * Number(property.price || 0);


    /*
    =====================================================
    CONFIRM BOOKING
    =====================================================
    */

    const handleConfirmBooking = async () => {

        setSubmitError("");
        setSubmitSuccess("");

        if (!selection.checkIn || selection.dayCount < 1) {

            setSubmitError("Please select at least one date.");

            return;

        }

        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {

            setSubmitError("Your session has expired. Please login again.");

            setTimeout(() => navigate("/login"), 1200);

            return;

        }

        try {

            const user = JSON.parse(storedUser);

            if (user.role !== "guest") {

                setSubmitError("Only guest accounts can book properties.");

                return;

            }

        } catch (error) {

            console.error("User info error:", error);

            setSubmitError("Your session is invalid. Please login again.");

            return;

        }

        try {

            setSubmitting(true);

            const response = await fetch(`${API_BASE}/bookings`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    property_id: property.id,
                    check_in: selection.checkIn,
                    check_out: selection.checkOut,
                    day_count: selection.dayCount,
                    guests
                })

            });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Failed to create booking."
                );

            }

            setSubmitSuccess("✓ Your booking is confirmed — this property is now reserved for your dates.");

            if (onBookingSuccess) {
                onBookingSuccess(data.booking);
            }

            setTimeout(() => {
                onClose();
            }, 1600);

        } catch (error) {

            console.error("Create booking error:", error);

            setSubmitError(
                error.message || "Failed to create booking."
            );

        } finally {

            setSubmitting(false);

        }

    };


    return (

        <div
            className="booking-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >

            <div className="booking-modal">

                <div className="booking-modal-header">

                    <h3>Book "{property.title}"</h3>

                    <button
                        type="button"
                        className="booking-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>

                {submitError && (
                    <div className="booking-modal-error">{submitError}</div>
                )}

                {submitSuccess && (
                    <div className="booking-modal-success">{submitSuccess}</div>
                )}

                {loadingAvailability ? (

                    <p>Loading availability…</p>

                ) : availabilityError ? (

                    <div className="booking-modal-error">{availabilityError}</div>

                ) : (

                    <>

                        <div className="booking-modal-section">

                            <AvailabilityCalendar
                                bookedRanges={bookedRanges}
                                blockedRanges={blockedRanges}
                                minDate={todayDateString()}
                                onRangeChange={setSelection}
                            />

                        </div>

                        <div className="booking-modal-section form-group">

                            <label htmlFor="booking-guests">
                                Guests (max {property.maximum_guests})
                            </label>

                            <input
                                id="booking-guests"
                                type="number"
                                min={1}
                                max={property.maximum_guests || undefined}
                                value={guests}
                                onChange={(e) => {

                                    const value = Number(e.target.value);

                                    if (!value || value < 1) {
                                        setGuests(1);
                                        return;
                                    }

                                    if (property.maximum_guests && value > property.maximum_guests) {
                                        setGuests(property.maximum_guests);
                                        return;
                                    }

                                    setGuests(value);

                                }}
                            />

                        </div>

                        <div className="booking-modal-section booking-modal-summary">

                            <div className="booking-modal-summary-row">
                                <span>Price / night</span>
                                <span>৳{property.price}</span>
                            </div>

                            <div className="booking-modal-summary-row">
                                <span>Days</span>
                                <span>{days ? `${days} day${days > 1 ? "s" : ""}` : "-"}</span>
                            </div>

                            <div className="booking-modal-summary-row total">
                                <span>Total</span>
                                <span>৳{totalPrice || 0}</span>
                            </div>

                            {/* Wallet balance warning */}
                            {walletBalance !== null && totalPrice > walletBalance && (
                                <p style={{ color: "var(--danger-color)", marginTop: "0.5rem" }}>
                                    Your wallet balance (৳{walletBalance}) is not enough for this booking (৳{totalPrice}).{" "}
                                    <a href="/wallet" style={{ color: "var(--primary-color)" }}>Recharge your wallet</a> first.
                                </p>
                            )}

                        </div>

                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ width: "100%" }}
                            disabled={
                                submitting ||
                                !selection.checkIn ||
                                selection.dayCount < 1 ||
                                (walletBalance !== null && totalPrice > walletBalance)
                            }
                            onClick={handleConfirmBooking}
                        >
                            {submitting ? "Booking…" : "Confirm Booking"}
                        </button>

                    </>

                )}

            </div>

        </div>

    );

}


export default BookingModal;