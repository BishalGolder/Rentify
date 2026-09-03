-- =====================================================
-- FORUM DISCUSSION SYSTEM
-- Run this once in the Supabase SQL Editor
-- (Project → SQL Editor → New query → paste → Run)
-- =====================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------
-- FORUM THREADS (topics)
-- ---------------------------------------------------
create table if not exists forum_threads (
    id           uuid primary key default gen_random_uuid(),
    author_id    uuid not null references profiles(id) on delete cascade,
    title        text not null,
    body         text not null,
    category     text not null default 'general'
                     check (category in ('general', 'tips', 'host-help', 'guest-help', 'announcements')),
    property_id  uuid references properties(id) on delete set null,
    is_pinned    boolean not null default false,
    reply_count  integer not null default 0,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists idx_forum_threads_category on forum_threads (category);
create index if not exists idx_forum_threads_created_at on forum_threads (created_at desc);

-- ---------------------------------------------------
-- FORUM REPLIES (comments on a thread)
-- ---------------------------------------------------
create table if not exists forum_replies (
    id          uuid primary key default gen_random_uuid(),
    thread_id   uuid not null references forum_threads(id) on delete cascade,
    author_id   uuid not null references profiles(id) on delete cascade,
    body        text not null,
    created_at  timestamptz not null default now()
);

create index if not exists idx_forum_replies_thread_id on forum_replies (thread_id);

-- ---------------------------------------------------
-- ATOMIC "ADD REPLY" FUNCTION
-- Keeps forum_threads.reply_count in sync without a
-- separate round trip / race condition.
-- ---------------------------------------------------
create or replace function add_forum_reply(
    p_thread_id uuid,
    p_author_id uuid,
    p_body text
)
returns forum_replies
language plpgsql
security definer
as $$
declare
    new_reply forum_replies;
begin
    insert into forum_replies (thread_id, author_id, body)
    values (p_thread_id, p_author_id, p_body)
    returning * into new_reply;

    update forum_threads
    set reply_count = reply_count + 1,
        updated_at = now()
    where id = p_thread_id;

    return new_reply;
end;
$$;

-- ---------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------
alter table forum_threads enable row level security;
alter table forum_replies enable row level security;

-- The forum is readable by anyone (logged in or not),
-- same as the rest of this app's public browsing pages.
drop policy if exists "forum_threads_select_all" on forum_threads;
create policy "forum_threads_select_all" on forum_threads
    for select
    using (true);

drop policy if exists "forum_threads_insert_own" on forum_threads;
create policy "forum_threads_insert_own" on forum_threads
    for insert
    with check (auth.uid() = author_id);

drop policy if exists "forum_threads_update_own" on forum_threads;
create policy "forum_threads_update_own" on forum_threads
    for update
    using (auth.uid() = author_id);

drop policy if exists "forum_threads_delete_own" on forum_threads;
create policy "forum_threads_delete_own" on forum_threads
    for delete
    using (auth.uid() = author_id);

drop policy if exists "forum_replies_select_all" on forum_replies;
create policy "forum_replies_select_all" on forum_replies
    for select
    using (true);

drop policy if exists "forum_replies_insert_own" on forum_replies;
create policy "forum_replies_insert_own" on forum_replies
    for insert
    with check (auth.uid() = author_id);

drop policy if exists "forum_replies_delete_own" on forum_replies;
create policy "forum_replies_delete_own" on forum_replies
    for delete
    using (auth.uid() = author_id);

-- NOTE: Admin moderation (deleting anyone's thread/reply) is done from the
-- backend with the service-role client, same pattern as the rest of the
-- app's admin routes — that bypasses RLS by design.
