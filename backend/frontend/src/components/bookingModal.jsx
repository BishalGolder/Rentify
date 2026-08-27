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

    const [selection, setSelection] = useState({ checkIn: null, checkOut: null });
    const [guests, setGuests] = useState(1);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");


    /*
    =====================================================
    LOAD AVAILABILITY
    =====================================================
    */

    useEffect(() => {

        const fetchAvailability = async () => {

            setLoadingAvailability(true);
            setAvailabilityError("");

            try {

                const response = await fetch(
                    `${API_BASE}/bookings/availability/${property.id}`
                );

                const data = await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message || "Failed to load availability."
                    );

                }

                setBookedRanges(
                    (data.bookedRanges || []).map((range) => ({
                        start: range.check_in,
                        end: range.check_out
                    }))
                );


                setBlockedRanges(
                    (data.blockedRanges || []).map((block) => ({
                        start: block.start_date,
                        end: block.end_date
                    }))
                );

            } catch (error) {

                console.error("Load availability error:", error);

                setAvailabilityError(
                    error.message || "Failed to load availability for this property."
                );

            } finally {

                setLoadingAvailability(false);

            }

        };

        fetchAvailability();

    }, [property.id]);


    /*
    =====================================================
    PRICE CALCULATION
    =====================================================
    */

    const nights =
        selection.checkIn && selection.checkOut
            ? Math.round(
                (new Date(selection.checkOut) - new Date(selection.checkIn)) /
                (1000 * 60 * 60 * 24)
            )
            : 0;

    const totalPrice = nights * Number(property.price || 0);


    /*
    =====================================================
    CONFIRM BOOKING
    =====================================================
    */

    const handleConfirmBooking = async () => {

        setSubmitError("");
        setSubmitSuccess("");

        if (!selection.checkIn || !selection.checkOut) {

            setSubmitError("Please select a check-in and check-out date.");

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
                                <span>Nights</span>
                                <span>{nights || "-"}</span>
                            </div>

                            <div className="booking-modal-summary-row total">
                                <span>Total</span>
                                <span>৳{totalPrice || 0}</span>
                            </div>

                        </div>

                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ width: "100%" }}
                            disabled={
                                submitting ||
                                !selection.checkIn ||
                                !selection.checkOut
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
