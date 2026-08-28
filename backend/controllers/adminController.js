import { serviceSupabase } from "../config/supabaseClient.js";


/*
    Get Admin Dashboard Summary
    GET /api/admin/summary
*/
export const getAdminSummary = async (req, res) => {
    try {

        if (!serviceSupabase) {
            return res.status(500).json({
                message:
                    "Server admin database client is not configured."
            });
        }


        const [
            usersResult,
            propertiesResult,
            pendingResult,
            bookingsResult
        ] = await Promise.all([

            serviceSupabase
                .from("profiles")
                .select("id", {
                    count: "exact",
                    head: true
                }),

            serviceSupabase
                .from("properties")
                .select("id", {
                    count: "exact",
                    head: true
                }),

            serviceSupabase
                .from("properties")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "verification_status",
                    "pending"
                ),

            serviceSupabase
                .from("bookings")
                .select("id", {
                    count: "exact",
                    head: true
                })
        ]);


        if (usersResult.error) {
            throw usersResult.error;
        }

        if (propertiesResult.error) {
            throw propertiesResult.error;
        }

        if (pendingResult.error) {
            throw pendingResult.error;
        }

        if (bookingsResult.error) {
            throw bookingsResult.error;
        }


        return res.json({
            totalUsers:
                usersResult.count || 0,

            totalProperties:
                propertiesResult.count || 0,

            pendingProperties:
                pendingResult.count || 0,

            totalBookings:
                bookingsResult.count || 0
        });


    } catch (error) {

        console.error(
            "Admin Summary Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to load admin dashboard summary."
        });
    }
};