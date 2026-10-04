-- ReelRep foundation schema. Source of truth for the database structure.
-- src/db/schema.ts mirrors the tables and columns for Drizzle queries, but
-- triggers, checks and RLS live only here, so never use `db:push`.
--
-- Apply: pnpm dotenv -e .env.local -- pnpm tsx scripts/run-sql.ts db/foundation.sql
-- Deferred until a session needs them: review_checks, votes.

begin;

drop table if exists public.smoke_test;

-- Enums ----------------------------------------------------------------------

create type public.review_status as enum ('pending', 'approved', 'rejected');
-- Keep in sync with TIER_THRESHOLDS in src/lib/reputation.ts
create type public.tier as enum ('bronze', 'silver', 'gold', 'critic');
-- 'correction' is for negative-delta rows that fix earlier events
create type public.rep_source as enum ('review', 'correction');

-- Tables ---------------------------------------------------------------------

create table public.profiles (
    id           uuid primary key references auth.users (id) on delete cascade,
    handle       text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
    tier         public.tier not null default 'bronze',
    -- Cache of SUM(reputation_events.delta), recomputed on approval
    rep_score    integer not null default 0,
    is_moderator boolean not null default false,
    created_at   timestamptz not null default now()
);

create table public.films (
    id          uuid primary key default gen_random_uuid(),
    tmdb_id     integer not null unique,
    title       text not null,
    year        integer,
    poster_path text,
    created_at  timestamptz not null default now()
);

create table public.reviews (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null references public.profiles (id) on delete cascade,
    film_id          uuid not null references public.films (id),
    rating           integer not null check (rating between 1 and 10),
    body             text not null,
    status           public.review_status not null default 'pending',
    submitted_at     timestamptz not null default now(),
    quality_grade    integer check (quality_grade between 1 and 3),
    decided_at       timestamptz,
    moderator_id     uuid references public.profiles (id),
    rejection_reason text,
    -- An approved review must carry the grade that set its reward
    check (status <> 'approved' or quality_grade is not null)
);

create unique index reviews_one_per_film on public.reviews (user_id, film_id);

-- Append-only ledger. No ON DELETE CASCADE: history is never removed.
create table public.reputation_events (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references public.profiles (id),
    source     public.rep_source not null,
    delta      integer not null,
    ref_id     uuid,
    epoch_week text not null check (epoch_week ~ '^\d{4}-W\d{2}$'),
    created_at timestamptz not null default now()
);

-- A review can earn reputation at most once, whatever the app code does
create unique index reputation_events_one_per_review
    on public.reputation_events (ref_id) where source = 'review';

create function public.reputation_events_append_only() returns trigger
language plpgsql as $$
begin
    raise exception 'reputation_events is append-only; insert a correction row instead';
end;
$$;

create trigger reputation_events_append_only
    before update or delete on public.reputation_events
    for each row execute function public.reputation_events_append_only();

-- RLS: enabled with no policies, on purpose. The Supabase data API (anon and
-- authenticated roles) can read nothing; Drizzle connects as postgres and bypasses RLS.

alter table public.profiles          enable row level security;
alter table public.films             enable row level security;
alter table public.reviews           enable row level security;
alter table public.reputation_events enable row level security;

-- Signup trigger: every new auth user gets a profile ---------------------------
-- Handles are random rather than derived from the email, so profile URLs
-- don't reveal anyone's address.

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    insert into public.profiles (id, handle)
    values (new.id, 'user_' || left(replace(new.id::text, '-', ''), 8));
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

commit;
