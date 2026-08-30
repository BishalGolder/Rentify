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
            hostsResult,
            guestsResult,
            propertiesResult,
            pendingResult,
            bookingsResult,
            cancelledResult,
            completedResult
        ] = await Promise.all([

            serviceSupabase
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("role", "host"),

            serviceSupabase
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("role", "guest"),

            serviceSupabase
                .from("properties")
                .select("id", { count: "exact", head: true }),

            serviceSupabase
                .from("properties")
                .select("id", { count: "exact", head: true })
                .eq("verification_status", "pending"),

            serviceSupabase
                .from("bookings")
                .select("id", { count: "exact", head: true }),

            serviceSupabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("status", "cancelled"),

            serviceSupabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("status", "completed")
        ]);

        for (const result of [
            hostsResult, guestsResult, propertiesResult,
            pendingResult, bookingsResult, cancelledResult, completedResult
        ]) {
            if (result.error) { throw result.error; }
        }

        return res.json({
            totalHosts: hostsResult.count || 0,
            totalGuests: guestsResult.count || 0,
            totalProperties: propertiesResult.count || 0,
            pendingProperties: pendingResult.count || 0,
            totalBookings: bookingsResult.count || 0,
            cancelledBookings: cancelledResult.count || 0,
            completedBookings: completedResult.count || 0
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