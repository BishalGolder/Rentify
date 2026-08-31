import * as BookingModel from "../models/bookingModel.js";
import * as AvailabilityModel from "../models/availabilityModel.js";
import { createNotification } from "../models/notificationModel.js";

import * as PropertyModel from "../models/propertyModel.js";


/*
=====================================================
DATE HELPERS
=====================================================

Dates are handled as plain "YYYY-MM-DD" strings
throughout this controller. That format sorts and
compares correctly with plain string operators, so
there's no need to pull in a date library or worry
about timezone drift from JS Date objects.
=====================================================
*/

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (value) => {

    if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(date.getTime());

};

const todayDateString = () => {

    return new Date().toISOString().slice(0, 10);

};

/*
    Do [aStart, aEnd) and [bStart, bEnd) overlap?
    (half-open ranges, same convention as the database's daterange)
*/
const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {

    return aStart < bEnd && aEnd > bStart;

};


/*
=====================================================
GET PROPERTY AVAILABILITY (PUBLIC)
=====================================================

Returns the booked date ranges AND host-blocked date
ranges for a property so the frontend calendar can
disable them. No authentication required — this is
public information, just like the calendar on a
typical booking site.
=====================================================
*/

export const getPropertyAvailability = async (req, res) => {

    try {

        const { propertyId } = req.params;

        const [bookedResult, blockedResult] = await Promise.all([
            BookingModel.getBookedRanges(propertyId),
            AvailabilityModel.getUnavailableRanges(propertyId)
        ]);

        if (bookedResult.error) {

            console.error("Get Booked Ranges Error:", bookedResult.error);

            return res.status(400).json({
                message: "Failed to load booked dates."
            });

        }

        if (blockedResult.error) {

            console.error("Get Blocked Ranges Error:", blockedResult.error);

            return res.status(400).json({
                message: "Failed to load blocked dates."
            });

        }

        return res.json({

            bookedRanges: (bookedResult.data || []).map((range) => ({
                check_in: range.check_in,
                check_out: range.check_out
            })),

            blockedRanges: (blockedResult.data || []).map((range) => ({
                id: range.id,
                start_date: range.start_date,
                end_date: range.end_date,
                reason: range.reason
            }))

        });

    } catch (error) {

        console.error("Get Property Availability Error:", error);

        return res.status(500).json({
            message: "Failed to load property availability."
        });

    }

};


/*
=====================================================
CREATE BOOKING
=====================================================

Flow:

Guest
 ↓
Validate dates / guest count
 ↓
Property exists & is verified
 ↓
No overlap with existing confirmed bookings
 ↓
No overlap with host-blocked dates
 ↓
Insert booking
 ↓
Notify host
=====================================================
*/

export const createBooking = async (req, res) => {

    try {

        const guestId = req.user.id;

        const { property_id, check_in, check_out } = req.body;

        let { guests } = req.body;


        /*
        ==============================================
        BASIC VALIDATION
        ==============================================
        */

        if (!property_id) {

            return res.status(400).json({
                message: "property_id is required."
            });

        }

        if (!isValidDateString(check_in) || !isValidDateString(check_out)) {

            return res.status(400).json({
                message: "Please provide valid check_in and check_out dates (YYYY-MM-DD)."
            });

        }

        if (check_out <= check_in) {

            return res.status(400).json({
                message: "Check-out date must be after the check-in date."
            });

        }

        if (check_in < todayDateString()) {

            return res.status(400).json({
                message: "Check-in date cannot be in the past."
            });

        }

        guests = guests ? Number(guests) : 1;

        if (!Number.isInteger(guests) || guests < 1) {

            return res.status(400).json({
                message: "Guests must be a positive whole number."
            });

        }


        /*
        ==============================================
        LOAD PROPERTY
        ==============================================
        */

        const { data: property, error: propertyError } =
            await BookingModel.getPropertyForBooking(property_id, req.supabase);

        if (propertyError || !property) {

            return res.status(404).json({
                message: "Property not found."
            });

        }

        if (property.verification_status !== "verified") {

            return res.status(400).json({
                message: "This property is not currently available for booking."
            });

        }

        if (property.host_id === guestId) {

            return res.status(400).json({
                message: "You can't book your own property."
            });

        }

        if (guests > property.maximum_guests) {

            return res.status(400).json({
                message: `This property allows a maximum of ${property.maximum_guests} guests.`
            });

        }


        /*
        ==============================================
        CHECK ALREADY BOOKED (pre-check for a clean
        error message — the database exclusion
        constraint below is the final safety net
        against race conditions)
        ==============================================
        */

        const { data: alreadyBooked, error: overlapError } =
            await BookingModel.hasOverlappingBooking(property_id, check_in, check_out, req.supabase);

        if (overlapError) {

            console.error("Overlap Check Error:", overlapError);

            return res.status(400).json({
                message: "Failed to verify availability."
            });

        }

        if (alreadyBooked) {

            return res.status(409).json({
                message: "This property is already booked for some or all of the selected dates."
            });

        }


        /*
        ==============================================
        CHECK HOST-BLOCKED DATES
        ==============================================
        */

        const { data: blockedRanges, error: blockedError } =
            await AvailabilityModel.getUnavailableRanges(property_id, req.supabase);

        if (blockedError) {

            console.error("Get Blocked Ranges Error:", blockedError);

            return res.status(400).json({
                message: "Failed to verify availability."
            });

        }

        const isBlocked = (blockedRanges || []).some((block) =>
            rangesOverlap(check_in, check_out, block.start_date, block.end_date)
        );

        if (isBlocked) {

            return res.status(409).json({
                message: "The host has marked some or all of these dates as unavailable."
            });

        }


        /*
        ==============================================
        CREATE BOOKING
        ==============================================
        */

        const { day_count } = req.body;
 
        // Use the explicit day count sent by the frontend (price-per-day model).
        // Fall back to the date-difference calculation for any API calls
        // that don't include day_count (e.g. direct API testing).
        const days = day_count && Number.isInteger(Number(day_count)) && Number(day_count) > 0
            ? Number(day_count)
            : Math.max(1, Math.round(
                (new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24)
              ) + 1);
 
        const totalPrice = days * Number(property.price);

 
        const { error: paymentError } = await req.supabase.rpc(
            "pay_booking_from_wallet",
            { p_guest_id: guestId, p_amount: totalPrice, p_booking_id: null }
        );
 
        if (paymentError) {
            return res.status(402).json({
                message: "Insufficient wallet balance. Please recharge your wallet and try again."
            });
        }
 
        const bookingData = {
            property_id,
            guest_id: guestId,
            check_in,
            check_out,
            number_of_guests: guests,
            total_price: totalPrice,
            status: "confirmed"
        };

        const { data, error } = await BookingModel.createBooking(bookingData, req.supabase);
 
        if (error) {

    console.error(
        "Create Booking Error:",
        error
    );


    /*
    ==============================================
    BOOKING CREATION FAILED AFTER WALLET PAYMENT
    ==============================================

    The booking does not exist, so this is NOT a
    booking cancellation/refund.

    We simply return the money to the wallet and
    record it as a payment reversal.
    ==============================================
    */

    const { data: reversalBalance, error: reversalError } =
        await req.supabase.rpc(
            "refund_booking_payment_failure",
            {
                p_guest_id: guestId,
                p_amount: totalPrice
            }
        );


    if (reversalError) {

        console.error(
            "Payment reversal error:",
            reversalError
        );

        return res.status(500).json({
            message:
                "Booking creation failed and the payment reversal could not be completed. Please contact support."
        });

    }


    return res.status(400).json({
        message:
            "Booking could not be created. Your wallet payment has been returned.",
        wallet_balance: reversalBalance
    });

}


        /*
        ==============================================
        NOTIFY HOST
        ==============================================
        */

        try {

            await createNotification({
                user_id: property.host_id,
                type: "booking_created",
                title: "New Booking",
                message: `Your property "${property.title}" has been booked from ${check_in} to ${check_out}.`,
                related_entity_type: "booking",
                related_entity_id: data.id
            }, req.supabase);

        } catch (notificationError) {

            console.error("Notification creation error:", notificationError);

        }


        return res.status(201).json({
            message: "Booking confirmed.",
            booking: data
        });

    } catch (error) {

        console.error("Create Booking Error:", error);

        return res.status(500).json({
            message: "Failed to create booking.",
            error: error.message
        });

    }

};


/*
=====================================================
GET MY BOOKINGS (guest)
=====================================================
*/

export const getMyBookings = async (req, res) => {

    try {

        const { data, error } =
            await BookingModel.getMyBookings(req.user.id, req.supabase);

        if (error) {

            console.error("Get My Bookings Error:", error);

            return res.status(400).json({
                message: "Failed to load your bookings."
            });

        }

        return res.json(data || []);

    } catch (error) {

        console.error("Get My Bookings Error:", error);

        return res.status(500).json({
            message: "Failed to load your bookings."
        });

    }

};


/*
=====================================================
GET BOOKINGS FOR ONE OF THE HOST'S PROPERTIES
=====================================================
*/

export const getPropertyBookings = async (req, res) => {

    try {

        const hostId = req.user.id;

        const { propertyId } = req.params;

        const { data: property, error: propertyError } =
            await BookingModel.getPropertyForBooking(propertyId, req.supabase);

        if (propertyError || !property) {

            return res.status(404).json({
                message: "Property not found."
            });

        }

        if (property.host_id !== hostId) {

            return res.status(403).json({
                message: "You can only view bookings for your own properties."
            });

        }

        const { data, error } =
            await BookingModel.getPropertyBookings(propertyId, req.supabase);

        if (error) {

            console.error("Get Property Bookings Error:", error);

            return res.status(400).json({
                message: "Failed to load bookings for this property."
            });

        }

        return res.json(data || []);

    } catch (error) {

        console.error("Get Property Bookings Error:", error);

        return res.status(500).json({
            message: "Failed to load bookings for this property."
        });

    }

};


/*
=====================================================
CANCEL BOOKING (guest)
=====================================================
*/

export const cancelBooking = async (req, res) => {

    try {

        const guestId = req.user.id;

        const { id } = req.params;


        /*
        ==============================================
        CHECK THAT THE BOOKING EXISTS
        ==============================================
        */

        const { data: booking, error: findError } =
            await BookingModel.getBookingById(
                id,
                req.supabase
            );


        if (findError || !booking) {

            return res.status(404).json({
                message: "Booking not found."
            });

        }


        /*
        ==============================================
        VERIFY OWNERSHIP
        ==============================================
        */

        if (booking.guest_id !== guestId) {

            return res.status(403).json({
                message: "You can only cancel your own bookings."
            });

        }


        /*
        ==============================================
        VERIFY STATUS
        ==============================================
        */

        if (booking.status !== "confirmed") {

            return res.status(400).json({
                message:
                    "This booking has already been cancelled or is no longer cancellable."
            });

        }


        /*
        ==============================================
        CANCEL + REFUND
        ==============================================

        This single RPC:

        1. Cancels the booking
        2. Adds the money to the guest wallet
        3. Creates wallet transaction
        4. Creates booking refund record

        All inside one database transaction.
        ==============================================
        */

        const { data: cancelledBooking, error: refundError } =
            await req.supabase.rpc(
                "cancel_booking_and_refund",
                {
                    p_booking_id: id
                }
            );


        if (refundError) {

            console.error(
                "Cancel + Refund Error:",
                refundError
            );

            return res.status(400).json({
                message:
                    refundError.message ||
                    "Failed to cancel booking and process refund."
            });

        }


        /*
        ==============================================
        GET PROPERTY INFORMATION FOR HOST NOTIFICATION
        ==============================================
        */

        try {

            const { data: property } =
                await BookingModel.getPropertyForBooking(
                    booking.property_id,
                    req.supabase
                );


            if (property) {

                await createNotification({

                    user_id: property.host_id,

                    type: "booking_cancelled",

                    title: "Booking Cancelled",

                    message:
                        `Your property "${property.title}" has had a booking cancelled by the guest.`,

                    related_entity_type: "booking",

                    related_entity_id: booking.id

                }, req.supabase);

            }

        } catch (notificationError) {

            /*
            Notification failure should not make the
            cancellation/refund fail because the money
            has already been safely processed.
            */

            console.error(
                "Notification creation error:",
                notificationError
            );

        }


        /*
        ==============================================
        SUCCESS RESPONSE
        ==============================================
        */

        return res.json({

            message:
                "Booking cancelled successfully and refund processed.",

            booking: cancelledBooking,

            refund: {

                amount: Number(booking.total_price),

                status: "processed"

            }

        });


    } catch (error) {

        console.error(
            "Cancel Booking Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to cancel booking and process refund."
        });

    }

};

/*
=====================================================
GET HOST REVENUE SUMMARY
=====================================================
*/
 
export const getHostRevenue = async (req, res) => {
 
    try {
 
        const hostId = req.user.id;
 
        const { data: properties, error: propertiesError } =
            await PropertyModel.getHostProperties(hostId, req.supabase);
 
        if (propertiesError) {
            return res.status(400).json({ message: "Failed to load your properties." });
        }
 
        const propertyIds = (properties || []).map((p) => p.id);
 
        const { data: bookings, error: bookingsError } =
            await BookingModel.getBookingsForProperties(propertyIds, req.supabase);
 
        if (bookingsError) {
            return res.status(400).json({ message: "Failed to load your bookings." });
        }
 
        const totalRevenue = (bookings || []).reduce(
            (sum, b) => sum + Number(b.total_price), 0
        );
 
        const perProperty = (properties || []).map((property) => {
 
            const propertyBookings =
                (bookings || []).filter((b) => b.property_id === property.id);
 
            return {
                property_id: property.id,
                title: property.title,
                bookingCount: propertyBookings.length,
                revenue: propertyBookings.reduce(
                    (sum, b) => sum + Number(b.total_price), 0
                )
            };
 
        });
 
        const buildDailySeries = (days) => {
            const series = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().slice(0, 10);
                const dayTotal = (bookings || [])
                    .filter((b) => b.created_at.slice(0, 10) === dateStr)
                    .reduce((sum, b) => sum + Number(b.total_price), 0);
                series.push({ date: dateStr, revenue: dayTotal });
            }
            return series;
        };
 
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
 
        return res.json({
            totalRevenue,
            totalBookings: (bookings || []).length,
            perProperty,
            recentBookings: (bookings || []).slice(0, 10),
            last7Days: buildDailySeries(7),
            thisMonth: buildDailySeries(daysInMonth)
        });

 
    } catch (error) {
 
        console.error("Get Host Revenue Error:", error);
 
        return res.status(500).json({ message: "Failed to load revenue." });
 
    }
 
};

/*
    Get All Bookings For Admin
*/
export const getAllBookingsForAdmin = async (req, res) => {
    try {
        const { serviceSupabase } =
            await import("../config/supabaseClient.js");

        if (!serviceSupabase) {
            return res.status(500).json({
                message:
                    "Server admin database client is not configured."
            });
        }

        const { data, error } =
            await BookingModel.getAllBookingsForAdmin(
                serviceSupabase
            );

        if (error) {
            return res.status(400).json({
                message:
                    "Failed to load bookings.",
                error: error.message
            });
        }

        return res.json(data || []);

    } catch (error) {
        console.error(
            "Get All Bookings For Admin Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to load bookings."
        });
    }
};