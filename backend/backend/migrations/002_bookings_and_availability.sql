-- =====================================================================
-- Rentify — Booking Feature Migration
-- =====================================================================
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New
-- query -> paste -> Run). It only ADDS new tables/functions/policies.
-- It does not touch any existing table (properties, profiles, wishlists,
-- notifications, property_images, ...).
--
-- What this creates:
--   1. public.bookings                 -> confirmed guest reservations
--   2. public.property_unavailability  -> host-managed blocked date ranges
--   3. RLS policies for both tables
--   4. Two SECURITY DEFINER helper functions used by the backend to check
--      availability without exposing other guests' private booking data
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Extension needed for the "no overlapping date ranges" constraint
-- ---------------------------------------------------------------------
create extension if not exists btree_gist;


-- ---------------------------------------------------------------------
-- 1. BOOKINGS TABLE
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
    id                  uuid primary key default gen_random_uuid(),

    property_id         uuid not null references public.properties(id) on delete cascade,
    guest_id            uuid not null references auth.users(id) on delete cascade,

    check_in            date not null,
    check_out           date not null,

    guests              integer not null default 1,

    price_per_night     numeric(12, 2) not null,
    nights              integer generated always as (check_out - check_in) stored,
    total_price         numeric(12, 2) generated always as
                             (price_per_night * (check_out - check_in)) stored,

    status              text not null default 'confirmed'
                             check (status in ('confirmed', 'cancelled')),

    created_at          timestamptz not null default now(),
    cancelled_at         timestamptz,

    constraint bookings_valid_dates check (check_out > check_in),
    constraint bookings_valid_guests check (guests > 0),

    -- Hard database-level guarantee: two CONFIRMED bookings for the same
    -- property can never have overlapping date ranges, even under
    -- concurrent requests (protects against race conditions that a plain
    -- application-level check cannot fully prevent).
    constraint bookings_no_overlap exclude using gist (
        property_id with =,
        daterange(check_in, check_out, '[)') with &&
    ) where (status = 'confirmed')
);

create index if not exists bookings_property_id_idx on public.bookings(property_id);
create index if not exists bookings_guest_id_idx on public.bookings(guest_id);


-- ---------------------------------------------------------------------
-- 2. PROPERTY UNAVAILABILITY TABLE (host-managed blocked ranges)
-- ---------------------------------------------------------------------
create table if not exists public.property_unavailability (
    id             uuid primary key default gen_random_uuid(),

    property_id    uuid not null references public.properties(id) on delete cascade,
    host_id        uuid not null references auth.users(id) on delete cascade,

    start_date     date not null,
    end_date       date not null,

    reason         text,

    created_at     timestamptz not null default now(),

    constraint unavailability_valid_dates check (end_date > start_date),

    constraint unavailability_no_overlap exclude using gist (
        property_id with =,
        daterange(start_date, end_date, '[)') with &&
    )
);

create index if not exists property_unavailability_property_id_idx
    on public.property_unavailability(property_id);


-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.bookings enable row level security;
alter table public.property_unavailability enable row level security;

-- BOOKINGS ------------------------------------------------------------

-- Guests can see their own bookings.
drop policy if exists "Guests can view their own bookings" on public.bookings;
create policy "Guests can view their own bookings"
    on public.bookings
    for select
    using (guest_id = auth.uid());

-- Hosts can see the bookings made on their own properties.
drop policy if exists "Hosts can view bookings on their properties" on public.bookings;
create policy "Hosts can view bookings on their properties"
    on public.bookings
    for select
    using (
        exists (
            select 1 from public.properties p
            where p.id = bookings.property_id
              and p.host_id = auth.uid()
        )
    );

-- A logged-in guest can create a booking for themself.
drop policy if exists "Guests can create their own bookings" on public.bookings;
create policy "Guests can create their own bookings"
    on public.bookings
    for insert
    with check (guest_id = auth.uid());

-- A guest can cancel (update status of) their own booking.
drop policy if exists "Guests can cancel their own bookings" on public.bookings;
create policy "Guests can cancel their own bookings"
    on public.bookings
    for update
    using (guest_id = auth.uid())
    with check (guest_id = auth.uid());

-- PROPERTY UNAVAILABILITY ----------------------------------------------

-- Anyone (including logged-out visitors) can read blocked ranges so the
-- booking calendar can show which dates are unavailable.
drop policy if exists "Anyone can view unavailability blocks" on public.property_unavailability;
create policy "Anyone can view unavailability blocks"
    on public.property_unavailability
    for select
    using (true);

-- Only the property's own host can add/remove blocks on it.
drop policy if exists "Hosts manage blocks on their own properties" on public.property_unavailability;
create policy "Hosts manage blocks on their own properties"
    on public.property_unavailability
    for all
    using (
        host_id = auth.uid()
        and exists (
            select 1 from public.properties p
            where p.id = property_unavailability.property_id
              and p.host_id = auth.uid()
        )
    )
    with check (
        host_id = auth.uid()
        and exists (
            select 1 from public.properties p
            where p.id = property_unavailability.property_id
              and p.host_id = auth.uid()
        )
    );


-- ---------------------------------------------------------------------
-- 4. HELPER FUNCTIONS (SECURITY DEFINER)
-- ---------------------------------------------------------------------
-- These intentionally return ONLY date ranges (never guest identity), so
-- it is safe to expose them to anyone — this is what powers the public
-- "unavailable dates" calendar on a property page, the same way Airbnb
-- shows a calendar to logged-out visitors.

create or replace function public.get_booked_ranges(p_property_id uuid)
returns table(check_in date, check_out date)
language sql
security definer
set search_path = public
as $$
    select check_in, check_out
    from public.bookings
    where property_id = p_property_id
      and status = 'confirmed';
$$;

grant execute on function public.get_booked_ranges(uuid) to anon, authenticated;


create or replace function public.has_overlapping_booking(
    p_property_id uuid,
    p_check_in date,
    p_check_out date
)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.bookings
        where property_id = p_property_id
          and status = 'confirmed'
          and check_in < p_check_out
          and check_out > p_check_in
    );
$$;

grant execute on function public.has_overlapping_booking(uuid, date, date) to anon, authenticated;

-- =====================================================================
-- End of migration
-- =====================================================================
