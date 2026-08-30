import supabase from "../config/supabaseClient.js";
 
 
/*
    Get A Property's Id / Host / Price / Status
    (used to validate a booking request before it's created)
*/
export const getPropertyForBooking = async (propertyId, client = supabase) => {
 
    const { data, error } = await client
        .from("properties")
        .select("id, host_id, price, maximum_guests, verification_status, title")
        .eq("id", propertyId)
        .single();
 
    return { data, error };
};
 
 
/*
    Get The Confirmed Booked Date Ranges For A Property (public-safe —
    only dates, never guest identity). Backed by the get_booked_ranges()
    SECURITY DEFINER function so it works for anyone, logged in or not.
*/
export const getBookedRanges = async (propertyId, client = supabase) => {
 
    const { data, error } = await client
        .rpc("get_booked_ranges", { p_property_id: propertyId });
 
    return { data, error };
};
 
 
/*
    Check Whether A Given Date Range Already Has A Confirmed Booking
    (public-safe, backed by has_overlapping_booking()).
*/
export const hasOverlappingBooking = async (propertyId, checkIn, checkOut, client = supabase) => {
 
    const { data, error } = await client
        .rpc("has_overlapping_booking", {
            p_property_id: propertyId,
            p_check_in: checkIn,
            p_check_out: checkOut
        });
 
    return { data, error };
};
 
 
/*
    Create Booking
*/
export const createBooking = async (bookingData, client = supabase) => {
 
    const { data, error } = await client
        .from("bookings")
        .insert([bookingData])
        .select()
        .single();
 
    return { data, error };
};
 
 
/*
    Get All Bookings For The Logged-in Guest
*/
export const getMyBookings = async (guestId, client = supabase) => {
 
    const { data, error } = await client
        .from("bookings")
        .select(`
            id,
            check_in,
            check_out,
            number_of_guests,
            total_price,
            status,
            special_requests,
            created_at,
            property_id,
            properties (
                id,
                title,
                location,
                district,
                image_urls,
                price
            )
        `)
        .eq("guest_id", guestId)
        .order("check_in", { ascending: false });
 
    return { data, error };
};
 
 
/*
    Get All Bookings For One Of A Host's Properties
*/
export const getPropertyBookings = async (propertyId, client = supabase) => {
 
    const { data, error } = await client
        .from("bookings")
        .select("id, check_in, check_out, number_of_guests, total_price, status, created_at")
        .eq("property_id", propertyId)
        .order("check_in", { ascending: true });
 
    return { data, error };
};
 
 
/*
    Get All Confirmed/Completed Bookings Across A Set Of Properties
    (used by the host revenue dashboard — Step 9)
*/
export const getBookingsForProperties = async (propertyIds, client = supabase) => {
 
    if (!propertyIds || propertyIds.length === 0) {
        return { data: [], error: null };
    }
 
    const { data, error } = await client
        .from("bookings")
        .select("id, property_id, check_in, check_out, number_of_guests, total_price, status, created_at")
        .in("property_id", propertyIds)
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: false });
 
    return { data, error };
};
 
 
/*
    Get A Single Booking By Id
*/
export const getBookingById = async (bookingId, client = supabase) => {
 
    const { data, error } = await client
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();
 
    return { data, error };
};
 
 
/*
    Cancel A Booking (guest can only cancel their own, still-confirmed booking)
*/
export const cancelBooking = async (bookingId, guestId, client = supabase) => {
 
    const { data, error } = await client
        .from("bookings")
        .update({
            status: "cancelled",
            updated_at: new Date().toISOString()
        })
        .eq("id", bookingId)
        .eq("guest_id", guestId)
        .eq("status", "confirmed")
        .select()
        .single();
 
    return { data, error };
};
/*
    Get All Bookings For Admin
*/
export const getAllBookingsForAdmin = async (client) => {

    const { data, error } = await client
        .from("bookings")
        .select(`
            id,
            property_id,
            guest_id,
            check_in,
            check_out,
            number_of_guests,
            total_price,
            status,
            special_requests,
            created_at,
            updated_at,
            properties (
                id,
                title,
                location,
                district
            )
        `)
        .order("created_at", { ascending: false });

    return { data, error };
};