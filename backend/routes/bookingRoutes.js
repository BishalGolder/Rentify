import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import guestMiddleware from "../middleware/guestMiddleware.js";
import hostMiddleware from "../middleware/hostMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
    getPropertyAvailability,
    createBooking,
    getMyBookings,
    getPropertyBookings,
    getHostRevenue,
    cancelBooking,
    getAllBookingsForAdmin
} from "../controllers/bookingController.js";


const router = express.Router();


/*
=====================================================
GET PROPERTY AVAILABILITY (PUBLIC)
=====================================================

Returns booked + host-blocked date ranges for a
property so the booking calendar can disable them.
No login required, same as viewing the property itself.
=====================================================
*/

router.get("/availability/:propertyId", getPropertyAvailability);


/*
=====================================================
CREATE BOOKING (guest only)
=====================================================
*/

router.post("/", authMiddleware, guestMiddleware, createBooking);


/*
=====================================================
GET MY BOOKINGS (guest only)
=====================================================
*/

router.get("/my-bookings", authMiddleware, guestMiddleware, getMyBookings);


/*
=====================================================
GET BOOKINGS FOR ONE OF THE HOST'S PROPERTIES (host only)
=====================================================
*/

router.get("/property/:propertyId", authMiddleware, hostMiddleware, getPropertyBookings);


/*
=====================================================
CANCEL BOOKING (guest only)
=====================================================
*/
/*
=====================================================
GET ALL BOOKINGS (admin only)
=====================================================
*/
router.get(
    "/admin/all",
    authMiddleware,
    adminMiddleware,
    getAllBookingsForAdmin
);
router.put("/:id/cancel", authMiddleware, guestMiddleware, cancelBooking);

router.get("/host/revenue", authMiddleware, hostMiddleware, getHostRevenue);


export default router;
