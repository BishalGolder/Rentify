import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import AvailabilityCalendar, { todayDateString, addDaysToDateString } from "../components/availabilityCalendar";

import "../styles/profile-property.css";
import "../styles/booking.css";


const API_BASE = "http://localhost:5000/api";


function ManageAvailability() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const [bookedRanges, setBookedRanges] = useState([]);
    const [blockedRanges, setBlockedRanges] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [hostBookings, setHostBookings] = useState([]);

    const [selectedDates, setSelectedDates] = useState([]);
    const [reason, setReason] = useState("");

    const [savingBlock, setSavingBlock] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");


    const getToken = () => {

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return null;
        }

        return token;

    };


    /*
    =====================================================
    LOAD PROPERTY + AVAILABILITY + HOST BOOKINGS
    =====================================================
    */

    const loadData = useCallback(async () => {

        setLoading(true);
        setPageError("");

        const token = getToken();

        if (!token) return;

        try {

            const [propertyRes, availabilityRes, blocksRes, bookingsRes] =
                await Promise.all([

                    fetch(`${API_BASE}/properties/${id}`),

                    fetch(`${API_BASE}/bookings/availability/${id}`),

                    fetch(`${API_BASE}/availability/${id}`),

                    fetch(`${API_BASE}/bookings/property/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })

                ]);

            const propertyData = await propertyRes.json();

            if (!propertyRes.ok) {
                throw new Error(propertyData.message || "Failed to load property.");
            }

            setProperty(propertyData);

            const availabilityData = await availabilityRes.json();

            if (!availabilityRes.ok) {
                throw new Error(availabilityData.message || "Failed to load availability.");
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

            const blocksData = await blocksRes.json();

            if (!blocksRes.ok) {
                throw new Error(blocksData.message || "Failed to load blocked dates.");
            }

            setBlocks(Array.isArray(blocksData) ? blocksData : []);

            const bookingsData = await bookingsRes.json();

            if (!bookingsRes.ok) {
                throw new Error(bookingsData.message || "Failed to load bookings.");
            }

            setHostBookings(Array.isArray(bookingsData) ? bookingsData : []);

        } catch (error) {

            console.error("Load availability manager error:", error);

            setPageError(
                error.message || "Failed to load this property's availability."
            );

        } finally {

            setLoading(false);

        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);


    useEffect(() => {

        loadData();

    }, [loadData]);


    /*
    =====================================================
    ADD BLOCK
    =====================================================
    */

    const groupIntoContiguousRuns = (datesSorted) => {
 
        const runs = [];
 
        for (const date of datesSorted) {
 
            const lastRun = runs[runs.length - 1];
 
            if (lastRun && addDaysToDateString(lastRun[lastRun.length - 1], 1) === date) {
                lastRun.push(date);
            } else {
                runs.push([date]);
            }
 
        }
 
        return runs;
 
    };
 
 
    const handleAddBlock = async () => {
 
        setFormError("");
        setFormSuccess("");
 
        if (selectedDates.length === 0) {
 
            setFormError("Please select at least one date on the calendar.");
 
            return;
 
        }
 
        const token = getToken();
 
        if (!token) return;
 
        try {
 
            setSavingBlock(true);
 
            const runs = groupIntoContiguousRuns([...selectedDates].sort());
 
            for (const run of runs) {
 
                const response = await fetch(`${API_BASE}/availability`, {
 
                    method: "POST",
 
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
 
                    body: JSON.stringify({
                        property_id: id,
                        start_date: run[0],
                        end_date: addDaysToDateString(run[run.length - 1], 1),
                        reason: reason || undefined
                    })
 
                });
 
                const data = await response.json();
 
                if (!response.ok) {
                    throw new Error(data.message || "Failed to block these dates.");
                }
 
            }
 
            setFormSuccess(
                `${selectedDates.length} date${selectedDates.length > 1 ? "s" : ""} marked unavailable.`
            );
            setSelectedDates([]);
            setReason("");
 
            await loadData();
 
        } catch (error) {
 
            console.error("Add block error:", error);
 
            setFormError(error.message || "Failed to block these dates.");
 
            await loadData();
 
        } finally {
 
            setSavingBlock(false);
 
        }
 
    };



    /*
    =====================================================
    REMOVE BLOCK
    =====================================================
    */

    const handleRemoveBlock = async (blockId) => {

        const token = getToken();

        if (!token) return;

        try {

            setRemovingId(blockId);

            const response = await fetch(`${API_BASE}/availability/${blockId}`, {

                method: "DELETE",

                headers: { Authorization: `Bearer ${token}` }

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to remove this block.");
            }

            await loadData();

        } catch (error) {

            console.error("Remove block error:", error);

            alert(error.message || "Failed to remove this block.");

        } finally {

            setRemovingId(null);

        }

    };


    if (loading) {

        return (
            <div className="dashboard-container">
                <div className="ui-card">
                    <p>Loading availability manager…</p>
                </div>
            </div>
        );

    }

    if (pageError) {

        return (
            <div className="dashboard-container">
                <div className="ui-card">
                    <p style={{ color: "var(--danger-color)" }}>{pageError}</p>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/properties/manage")}
                    >
                        ← Back to My Properties
                    </button>
                </div>
            </div>
        );

    }

    return (

        <div className="dashboard-container">

            <div className="ui-card">

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/properties/manage")}
                    style={{ marginBottom: "1rem" }}
                >
                    ← Back to My Properties
                </button>

                <h2>Manage Availability — {property?.title}</h2>

                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Guests can't book this property on dates you mark unavailable
                    below, or on dates it's already booked. Blocking dates is
                    entirely optional — leave the calendar untouched and the
                    property stays bookable on every open date.
                </p>

                <div className="availability-manager-grid">

                    <div>

                        <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
                            Select dates to mark unavailable
                        </h3>

                        <AvailabilityCalendar
                            bookedRanges={bookedRanges}
                            blockedRanges={blockedRanges}
                            minDate={todayDateString()}
                            mode="multi"
                            onDatesChange={setSelectedDates}
                        />


                        {formError && (
                            <div className="booking-modal-error" style={{ marginTop: "1rem" }}>
                                {formError}
                            </div>
                        )}

                        {formSuccess && (
                            <div className="booking-modal-success" style={{ marginTop: "1rem" }}>
                                {formSuccess}
                            </div>
                        )}

                        <div className="form-group" style={{ marginTop: "1rem" }}>

                            <label htmlFor="block-reason">
                                Reason (optional)
                            </label>

                            <input
                                id="block-reason"
                                type="text"
                                placeholder="e.g. Maintenance, personal use…"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />

                        </div>

                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ marginTop: "0.75rem", width: "100%" }}
                                disabled={
                                savingBlock ||
                                selectedDates.length === 0
                            }

                            onClick={handleAddBlock}
                        >
                            {savingBlock ? "Saving…" : "Mark Dates Unavailable"}
                        </button>

                    </div>

                    <div>

                        <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
                            Currently blocked dates
                        </h3>

                        {blocks.length === 0 ? (

                            <p style={{ color: "var(--text-muted)" }}>
                                No dates are blocked. This property is open on
                                every date it isn't already booked.
                            </p>

                        ) : (

                            blocks.map((block) => (

                                <div key={block.id} className="block-list-item">

                                    <span>
                                        <strong>{block.start_date}</strong> → <strong>{block.end_date}</strong>
                                        {block.reason ? ` — ${block.reason}` : ""}
                                    </span>

                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        disabled={removingId === block.id}
                                        onClick={() => handleRemoveBlock(block.id)}
                                    >
                                        {removingId === block.id ? "Removing…" : "Unblock"}
                                    </button>

                                </div>

                            ))

                        )}

                        <h3 style={{ fontSize: "1rem", margin: "1.5rem 0 0.75rem" }}>
                            Upcoming & past bookings
                        </h3>

                        {hostBookings.length === 0 ? (

                            <p style={{ color: "var(--text-muted)" }}>
                                No guest has booked this property yet.
                            </p>

                        ) : (

                            hostBookings.map((booking) => (

                                <div key={booking.id} className="host-booking-item">

                                    <span>
                                        <strong>{booking.check_in}</strong> → <strong>{booking.check_out}</strong>
                                        {" "}({booking.number_of_guests} guest{booking.number_of_guests > 1 ? "s" : ""}) — ৳{booking.total_price}
                                    </span>


                                    <span
                                        className={`booking-status-badge ${booking.status}`}
                                    >
                                        {booking.status}
                                    </span>

                                </div>

                            ))

                        )}

                    </div>

                </div>

            </div>

        </div>

    );

}


export default ManageAvailability;
