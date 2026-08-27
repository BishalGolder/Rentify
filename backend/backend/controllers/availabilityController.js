import * as AvailabilityModel from "../models/availabilityModel.js";
import * as BookingModel from "../models/bookingModel.js";


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
=====================================================
GET UNAVAILABLE (BLOCKED) RANGES FOR A PROPERTY
=====================================================

Public — anyone can see which dates a host has
blocked, same as the booked-dates calendar.
=====================================================
*/

export const getUnavailableRanges = async (req, res) => {

    try {

        const { propertyId } = req.params;

        const { data, error } =
            await AvailabilityModel.getUnavailableRanges(propertyId);

        if (error) {

            console.error("Get Unavailable Ranges Error:", error);

            return res.status(400).json({
                message: "Failed to load unavailable dates."
            });

        }

        return res.json(data || []);

    } catch (error) {

        console.error("Get Unavailable Ranges Error:", error);

        return res.status(500).json({
            message: "Failed to load unavailable dates."
        });

    }

};


/*
=====================================================
CREATE UNAVAILABILITY BLOCK (host)
=====================================================

Lets a host mark a date range on their own property as
unavailable (e.g. for maintenance, personal use, or any
reason of their choosing). This is entirely optional —
a host never has to block anything, but the option is
always available, as required.
=====================================================
*/

export const createUnavailableRange = async (req, res) => {

    try {

        const hostId = req.user.id;

        const { property_id, start_date, end_date, reason } = req.body;

        if (!property_id) {

            return res.status(400).json({
                message: "property_id is required."
            });

        }

        if (!isValidDateString(start_date) || !isValidDateString(end_date)) {

            return res.status(400).json({
                message: "Please provide valid start_date and end_date (YYYY-MM-DD)."
            });

        }

        if (end_date <= start_date) {

            return res.status(400).json({
                message: "End date must be after the start date."
            });

        }

        if (start_date < todayDateString()) {

            return res.status(400).json({
                message: "Start date cannot be in the past."
            });

        }


        /*
        ==============================================
        CONFIRM PROPERTY OWNERSHIP
        ==============================================
        */

        const { data: property, error: propertyError } =
            await BookingModel.getPropertyForBooking(property_id, req.supabase);

        if (propertyError || !property) {

            return res.status(404).json({
                message: "Property not found."
            });

        }

        if (property.host_id !== hostId) {

            return res.status(403).json({
                message: "You can only manage availability for your own properties."
            });

        }


        /*
        ==============================================
        DON'T ALLOW BLOCKING DATES A GUEST ALREADY BOOKED
        ==============================================
        */

        const { data: alreadyBooked, error: overlapError } =
            await BookingModel.hasOverlappingBooking(property_id, start_date, end_date, req.supabase);

        if (overlapError) {

            console.error("Overlap Check Error:", overlapError);

            return res.status(400).json({
                message: "Failed to verify existing bookings."
            });

        }

        if (alreadyBooked) {

            return res.status(409).json({
                message: "A guest already has a confirmed booking within these dates, so they can't be blocked."
            });

        }


        /*
        ==============================================
        CREATE BLOCK
        ==============================================
        */

        const { data, error } = await AvailabilityModel.createUnavailableRange(
            {
                property_id,
                host_id: hostId,
                start_date,
                end_date,
                reason: reason || null
            },
            req.supabase
        );

        if (error) {

            console.error("Create Unavailable Range Error:", error);

            // 23P01 = Postgres exclusion_violation (overlaps another block)
            if (error.code === "23P01") {

                return res.status(409).json({
                    message: "This date range overlaps with a block that already exists for this property."
                });

            }

            return res.status(400).json({
                message: error.message || "Failed to block these dates."
            });

        }

        return res.status(201).json({
            message: "Dates marked as unavailable.",
            block: data
        });

    } catch (error) {

        console.error("Create Unavailable Range Error:", error);

        return res.status(500).json({
            message: "Failed to block these dates."
        });

    }

};


/*
=====================================================
DELETE UNAVAILABILITY BLOCK (host)
=====================================================

Removing a block makes those dates available again —
this is the "un-blocking" side of host-managed
availability.
=====================================================
*/

export const deleteUnavailableRange = async (req, res) => {

    try {

        const hostId = req.user.id;

        const { id } = req.params;

        const { data, error } =
            await AvailabilityModel.deleteUnavailableRange(id, hostId, req.supabase);

        if (error || !data) {

            return res.status(404).json({
                message: "Unavailability block not found, or you don't own this property."
            });

        }

        return res.json({
            message: "Dates are available again.",
            block: data
        });

    } catch (error) {

        console.error("Delete Unavailable Range Error:", error);

        return res.status(500).json({
            message: "Failed to remove this block."
        });

    }

};
