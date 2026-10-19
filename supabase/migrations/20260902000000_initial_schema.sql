-- Baseline schema for Sebenza, as built during the hackathon (2026-09-02).
-- Written down afterwards as a record of what was created by hand in the Supabase SQL Editor.
-- Later changes (constraints, owner-only security rules, the matching function) are in
-- 20261019110000_lock_down_rls.sql. The temporary open policies from the hackathon are
-- deliberately not recorded here, because the lockdown migration replaced them.
-- Safe to re-run.

-- PostGIS: location types and distance queries.
-- On the live project it was installed in the public schema, which is why
-- geography_columns, geometry_columns and spatial_ref_sys appear there.
create extension if not exists postgis;

-- Workers: one row per worker profile, with skill and location
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  skill text not null,
  location geography(point, 4326) not null,
  created_at timestamptz default now()
);

create index if not exists workers_location_idx
  on public.workers using gist (location);

-- Jobs: one row per posted job, with the skill needed and location
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references auth.users(id),
  title text not null,
  skill_needed text not null,
  location geography(point, 4326) not null,
  created_at timestamptz default now()
);

create index if not exists jobs_location_idx
  on public.jobs using gist (location);

-- Row level security on by default: with no policies, nobody can read or write
-- until the policies in the lockdown migration are applied.
alter table public.workers enable row level security;
alter table public.jobs enable row level security;