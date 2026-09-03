-- =====================================================
-- COUPON & DISCOUNT SYSTEM
-- Run this once in the Supabase SQL Editor
-- (Project → SQL Editor → New query → paste → Run)
-- =====================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------
-- COUPONS TABLE
-- ---------------------------------------------------
create table if not exists coupons (
    id                   uuid primary key default gen_random_uuid(),
    code                 text not null unique,
    description          text,
    discount_type        text not null check (discount_type in ('percentage', 'fixed')),
    discount_value        numeric not null check (discount_value > 0),
    max_discount_amount   numeric check (max_discount_amount is null or max_discount_amount > 0),
    min_booking_amount    numeric not null default 0,
    usage_limit          integer check (usage_limit is null or usage_limit > 0),
    times_used            integer not null default 0,
    per_user_limit        integer not null default 1 check (per_user_limit > 0),
    property_id          uuid references properties(id) on delete cascade,
    created_by            uuid not null references profiles(id) on delete cascade,
    created_by_role        text not null check (created_by_role in ('host', 'admin')),
    valid_from            timestamptz not null default now(),
    valid_until           timestamptz,
    is_active             boolean not null default true,
    created_at            timestamptz not null default now()
);

create index if not exists idx_coupons_code on coupons (code);
create index if not exists idx_coupons_created_by on coupons (created_by);
create index if not exists idx_coupons_property_id on coupons (property_id);

-- ---------------------------------------------------
-- COUPON USAGE TABLE (one row per redemption)
-- ---------------------------------------------------
create table if not exists coupon_usages (
    id               uuid primary key default gen_random_uuid(),
    coupon_id        uuid not null references coupons(id) on delete cascade,
    user_id          uuid not null references profiles(id) on delete cascade,
    booking_id       uuid references bookings(id) on delete set null,
    discount_amount  numeric not null,
    created_at       timestamptz not null default now()
);

create index if not exists idx_coupon_usages_coupon_id on coupon_usages (coupon_id);
create index if not exists idx_coupon_usages_user_id on coupon_usages (user_id);

-- ---------------------------------------------------
-- LINK BOOKINGS TO THE COUPON THAT WAS APPLIED
-- ---------------------------------------------------
alter table bookings add column if not exists coupon_id uuid references coupons(id);
alter table bookings add column if not exists discount_amount numeric not null default 0;

-- ---------------------------------------------------
-- ATOMIC "REDEEM COUPON" FUNCTION
-- Bumps times_used and inserts the usage row inside a
-- single transaction so concurrent bookings can't both
-- slip past usage_limit.
-- ---------------------------------------------------
create or replace function redeem_coupon(
    p_coupon_id uuid,
    p_user_id uuid,
    p_booking_id uuid,
    p_discount_amount numeric
)
returns void
language plpgsql
security definer
as $$
begin
    update coupons
    set times_used = times_used + 1
    where id = p_coupon_id;

    insert into coupon_usages (coupon_id, user_id, booking_id, discount_amount)
    values (p_coupon_id, p_user_id, p_booking_id, p_discount_amount);
end;
$$;

-- ---------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------
alter table coupons enable row level security;
alter table coupon_usages enable row level security;

-- Anyone (including guests validating a code) can read active coupons.
drop policy if exists "coupons_select_active" on coupons;
create policy "coupons_select_active" on coupons
    for select
    using (is_active = true);

-- A host/admin can always see the coupons they created (active or not).
drop policy if exists "coupons_select_own" on coupons;
create policy "coupons_select_own" on coupons
    for select
    using (auth.uid() = created_by);

drop policy if exists "coupons_insert_own" on coupons;
create policy "coupons_insert_own" on coupons
    for insert
    with check (auth.uid() = created_by);

drop policy if exists "coupons_update_own" on coupons;
create policy "coupons_update_own" on coupons
    for update
    using (auth.uid() = created_by);

drop policy if exists "coupons_delete_own" on coupons;
create policy "coupons_delete_own" on coupons
    for delete
    using (auth.uid() = created_by);

-- A user can see their own redemption history.
drop policy if exists "coupon_usages_select_own" on coupon_usages;
create policy "coupon_usages_select_own" on coupon_usages
    for select
    using (auth.uid() = user_id);

drop policy if exists "coupon_usages_insert_own" on coupon_usages;
create policy "coupon_usages_insert_own" on coupon_usages
    for insert
    with check (auth.uid() = user_id);

-- NOTE: Admin-wide management (viewing/editing every coupon regardless of
-- creator) is done from the backend with the service-role client, exactly
-- like the rest of this app's admin routes — that bypasses RLS by design.
