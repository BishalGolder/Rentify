# Rentify — Booking Feature: Setup Guide

This adds a full booking system to Rentify: guests book a property using a
per-property calendar (check-in → check-out), and hosts can optionally mark
date ranges on their own properties as unavailable. Nothing in your existing
code, routes, or database tables was changed — everything here is additive.

## 1. Run the database migration (required, one-time)

The feature needs two new tables in Supabase. I can't run this for you — I
don't have network access to your Supabase project from this environment —
so please run it yourself:

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Open `backend/migrations/002_bookings_and_availability.sql` from this zip.
3. Paste its full contents into the SQL Editor and click **Run**.

This creates:
- `public.bookings` — confirmed guest reservations, with a database-level
  constraint that makes double-booking the same dates impossible even under
  concurrent requests.
- `public.property_unavailability` — host-managed blocked date ranges.
- Row Level Security policies for both tables (guests only ever see/manage
  their own bookings; hosts only ever manage their own properties).
- Two small helper functions the backend calls to safely show "which dates
  are taken" to anyone, without ever exposing who booked what.

It does **not** touch `properties`, `profiles`, `wishlists`, `notifications`,
or any other existing table.

## 2. Install & run as usual

No new npm packages were added on either side, so your existing install/run
steps are unchanged:

```
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## 3. What's new, from a user's point of view

**Guests**
- On a property's detail page, "Book Stay" now opens a calendar. Booked and
  host-blocked dates are shown disabled/greyed out. Picking a check-in and
  check-out date shows the nights & total price, then "Confirm Booking".
- A new "My Bookings" button on the dashboard (guest role) lists all their
  bookings and lets them cancel an upcoming one.

**Hosts**
- On "My Properties" (`/properties/manage`), each verified property has a
  new "Manage Availability" button. That page shows the same calendar, lets
  the host pick a date range to mark unavailable (with an optional reason),
  lists current blocks with an "Unblock" button, and lists all bookings made
  on that property so far. Blocking dates is entirely optional — a host who
  never touches this page has a property that's bookable on every open date.

## 4. New backend endpoints

| Method | Route                                   | Auth        | Purpose |
|--------|------------------------------------------|-------------|---------|
| GET    | `/api/bookings/availability/:propertyId` | Public      | Booked + blocked ranges for a property |
| POST   | `/api/bookings`                          | Guest       | Create a booking |
| GET    | `/api/bookings/my-bookings`              | Guest       | List my bookings |
| GET    | `/api/bookings/property/:propertyId`     | Host (own)  | List bookings on my property |
| PUT    | `/api/bookings/:id/cancel`               | Guest (own) | Cancel my booking |
| GET    | `/api/availability/:propertyId`          | Public      | List a property's blocked ranges |
| POST   | `/api/availability`                      | Host (own)  | Block a date range |
| DELETE | `/api/availability/:id`                  | Host (own)  | Remove a block |

## 5. Files added

**Backend:** `migrations/002_bookings_and_availability.sql`,
`models/bookingModel.js`, `models/availabilityModel.js`,
`controllers/bookingController.js`, `controllers/availabilityController.js`,
`routes/bookingRoutes.js`, `routes/availabilityRoutes.js`.

**Frontend:** `components/availabilityCalendar.jsx`,
`components/bookingModal.jsx`, `pages/manageAvailability.jsx`,
`pages/myBookings.jsx`, `styles/booking.css`.

**Files with small additive edits only** (new imports/routes/buttons — no
existing line removed or changed): `backend/app.js`, `backend/server.js`,
`frontend/src/App.jsx`, `frontend/src/pages/dashboard.jsx`,
`frontend/src/pages/properties.jsx`. The single exception is
`frontend/src/pages/propertyDetails.jsx`, where the "Book Stay" button's
`onClick` was changed from a placeholder `alert("Booking flow coming
soon!")` to actually opening the booking modal — that placeholder was the
unfinished stub for this exact feature.
