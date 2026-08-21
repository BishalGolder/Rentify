import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import supabase, {
    serviceSupabase
} from "../config/supabaseClient.js";

const router = express.Router();


/*
    =====================================================
    SUBMIT A REVIEW
    POST /api/reviews
    =====================================================
*/
router.post("/", authMiddleware, async (req, res) => {
    try {
        const guestId = req.user.id;

        const {
            booking_id,
            property_id,
            rating,
            comment
        } = req.body;


        // Validate required fields
        if (!booking_id || !property_id || !rating || !comment?.trim()) {
            return res.status(400).json({
                message:
                    "booking_id, property_id, rating and comment are required."
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
            Check that:

            1. Booking exists
            2. Booking belongs to logged-in guest
            3. Booking belongs to this property
        */
        const {
            data: booking,
            error: bookingError
        } = await req.supabase
            .from("bookings")
            .select("id, property_id, guest_id, status")
            .eq("id", booking_id)
            .eq("guest_id", guestId)
            .eq("property_id", property_id)
            .maybeSingle();


        if (bookingError) {
            return res.status(400).json({
                message: bookingError.message
            });
        }


        if (!booking) {
            return res.status(403).json({
                message:
                    "You do not have a valid booking for this property."
            });
        }


        /*
            Guest can review only after completing stay
        */
        if (booking.status !== "completed") {
            return res.status(400).json({
                message:
                    "You can only review a property after completing your stay."
            });
        }


        /*
            Prevent duplicate review for the same booking
        */
        const {
            data: existingReview,
            error: existingReviewError
        } = await req.supabase
            .from("reviews")
            .select("id")
            .eq("booking_id", booking_id)
            .maybeSingle();


        if (existingReviewError) {
            return res.status(400).json({
                message: existingReviewError.message
            });
        }


        if (existingReview) {
            return res.status(409).json({
                message:
                    "You have already reviewed this booking."
            });
        }


        /*
            Insert the review
        */
        const {
            data: review,
            error: reviewError
        } = await req.supabase
            .from("reviews")
            .insert([
                {
                    booking_id: booking_id,
                    property_id: property_id,
                    guest_id: guestId,
                    rating: numericRating,
                    comment: comment.trim()
                }
            ])
            .select()
            .single();


        if (reviewError) {
            return res.status(400).json({
                message: reviewError.message
            });
        }


        /*
            Get all ratings for this property
        */
        const {
            data: ratings,
            error: ratingsError
        } = await req.supabase
            .from("reviews")
            .select("rating")
            .eq("property_id", property_id);


        if (ratingsError) {
            return res.status(400).json({
                message: ratingsError.message
            });
        }


        /*
            Calculate average rating
        */
        const total = ratings.reduce(
            (sum, item) => sum + Number(item.rating),
            0
        );

        const averageRating =
            ratings.length > 0
                ? Number(
                    (total / ratings.length).toFixed(2)
                )
                : 0;


        /*
            Update property's average rating
        */
        if (!serviceSupabase) {
            console.error(
                "SUPABASE_SERVICE_ROLE_KEY is missing."
            );

            return res.status(500).json({
                message:
                    "Review was saved, but property rating could not be updated."
            });
        }


        const {
            error: propertyError
        } = await serviceSupabase
            .from("properties")
            .update({
                average_rating: averageRating
            })
            .eq("id", property_id);


        if (propertyError) {

            console.error(
                "Could not update average rating:",
                propertyError.message
            );

            return res.status(500).json({
                message:
                    "Review was saved, but property rating could not be updated."
            });
        }


        return res.status(201).json({
            message: "Review submitted successfully.",
            review: review,
            average_rating: averageRating
        });


    } catch (error) {

        console.error(
            "Review submission error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error."
        });
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