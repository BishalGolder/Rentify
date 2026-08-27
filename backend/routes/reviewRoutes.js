import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import guestMiddleware from "../middleware/guestMiddleware.js";
import supabase from "../config/supabaseClient.js";


const router = express.Router();


/*
    =====================================================
    SUBMIT A REVIEW
    POST /api/reviews
    =====================================================
*/
router.post("/", authMiddleware, guestMiddleware, async (req, res) => {
    try {
        const guestId = req.user.id;

        const {
            property_id,
            rating,
            comment
        } = req.body;


        // Validate required fields
        if (!property_id || !rating || !comment?.trim()) {
            return res.status(400).json({
                message:
                    "property_id, rating and comment are required."
            });
        }


        // Validate rating
        const numericRating = Number(rating);

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                message: "Rating must be an integer between 1 and 5."
            });
        }


        /*
            Confirm the property actually exists
            (gives a clear message instead of a raw FK error)
        */
        const {
            data: property,
            error: propertyError
        } = await req.supabase
            .from("properties")
            .select("id")
            .eq("id", property_id)
            .maybeSingle();

        if (propertyError) {
            return res.status(400).json({ message: propertyError.message });
        }

        if (!property) {
            return res.status(404).json({ message: "Property not found." });
        }


        /*
            TEMPORARY (Part 1): one review per guest per
            property, with no stay required. Part 2
            replaces this with the real completed-stay check.
        */
        const {
            data: existingReview,
            error: existingReviewError
        } = await req.supabase
            .from("reviews")
            .select("id")
            .eq("property_id", property_id)
            .eq("guest_id", guestId)
            .maybeSingle();

        if (existingReviewError) {
            return res.status(400).json({ message: existingReviewError.message });
        }

        if (existingReview) {
            return res.status(409).json({
                message: "You have already reviewed this property."
            });
        }


        /*
            Insert the review — no booking_id for now (Part 1)
        */
        const {
            data: review,
            error: reviewError
        } = await req.supabase
            .from("reviews")
            .insert([
                {
                    booking_id: null,
                    property_id: property_id,
                    guest_id: guestId,
                    rating: numericRating,
                    comment: comment.trim()
                }
            ])
            .select()
            .single();

        if (reviewError) {
            return res.status(400).json({ message: reviewError.message });
        }


        /*
            Recalculate the property's average rating
            (atomic, database-side — see Step 1b)
        */
        const {
            data: averageRating,
            error: avgError
        } = await req.supabase.rpc(
            "recalculate_property_rating",
            { p_property_id: property_id }
        );

        if (avgError) {
            console.error("Could not update average rating:", avgError.message);
            return res.status(500).json({
                message: "Review was saved, but the property rating could not be updated."
            });
        }

        return res.status(201).json({
            message: "Review submitted successfully.",
            review: review,
            average_rating: averageRating
        });

    } catch (error) {
        console.error("Review submission error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});



/*
    =====================================================
    CHECK REVIEW ELIGIBILITY
    GET /api/reviews/eligible/:propertyId
    =====================================================

    Finds a completed booking belonging to the
    currently logged-in guest.

    The booking must also not have been reviewed yet.
*/
router.get(
    "/eligible/:propertyId",
    authMiddleware,
    async (req, res) => {

        try {

            const guestId = req.user.id;
            const { propertyId } = req.params;


            /*
                Find completed bookings for this
                guest + property
            */
            const {
                data: bookings,
                error: bookingError
            } = await req.supabase
                .from("bookings")
                .select(
                    "id, property_id, guest_id, status"
                )
                .eq("guest_id", guestId)
                .eq("property_id", propertyId)
                .eq("status", "completed");


            if (bookingError) {
                return res.status(400).json({
                    message: bookingError.message
                });
            }


            /*
                No completed booking
            */
            if (
                !bookings ||
                bookings.length === 0
            ) {

                return res.json({
                    eligible: false,
                    booking_id: null,
                    message:
                        "No completed booking found for this property."
                });
            }


            /*
                Check completed bookings and find one
                that has not been reviewed
            */
            for (const booking of bookings) {

                const {
                    data: existingReview,
                    error: reviewError
                } = await req.supabase
                    .from("reviews")
                    .select("id")
                    .eq(
                        "booking_id",
                        booking.id
                    )
                    .maybeSingle();


                if (reviewError) {
                    return res.status(400).json({
                        message:
                            reviewError.message
                    });
                }


                /*
                    Found eligible booking
                */
                if (!existingReview) {

                    return res.json({
                        eligible: true,
                        booking_id: booking.id
                    });
                }
            }


            /*
                Completed bookings exist,
                but all were already reviewed
            */
            return res.json({
                eligible: false,
                booking_id: null,
                message:
                    "You have already reviewed your completed stay."
            });


        } catch (error) {

            console.error(
                "Review eligibility error:",
                error
            );

            return res.status(500).json({
                message:
                    "Internal server error."
            });
        }
    }
);



/*
    =====================================================
    GET REVIEWS FOR A PROPERTY
    GET /api/reviews/property/:propertyId
    =====================================================
*/
router.get(
    "/property/:propertyId",
    async (req, res) => {

        try {

            const { propertyId } = req.params;


            const {
                data: reviews,
                error
            } = await supabase
                .from("reviews")
                .select(`
                    id,
                    guest_id,
                    rating,
                    comment,
                    created_at
                `)
                .eq(
                    "property_id",
                    propertyId
                )
                .order(
                    "created_at",
                    { ascending: false }
                );


            if (error) {
                return res.status(400).json({
                    message: error.message
                });
            }


            return res.status(200).json(
                reviews || []
            );


        } catch (error) {

            console.error(
                "Get reviews error:",
                error
            );

            return res.status(500).json({
                message:
                    "Internal server error."
            });
        }
    }
);


export default router;