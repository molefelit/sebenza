-- Lock down database security (applied manually via the Supabase SQL Editor on 2026-10-19)
-- Replaces the wide-open hackathon policies with owner-only row level security,
-- adds input validation and one worker profile per user, and rewrites the match function
-- so employers only get name, skill and distance for jobs they own.
-- Safe to re-run.

-- Keep only the newest worker profile per user, then enforce one per user
delete from public.workers w
using public.workers newer
where w.user_id = newer.user_id
  and (w.created_at, w.id) < (newer.created_at, newer.id);

alter table public.workers drop constraint if exists workers_user_id_key;
alter table public.workers add constraint workers_user_id_key unique (user_id);

-- Input validation
alter table public.workers drop constraint if exists workers_skill_check;
alter table public.workers add constraint workers_skill_check
  check (skill in ('gardening','domestic','piece_work'));
alter table public.workers drop constraint if exists workers_name_check;
alter table public.workers add constraint workers_name_check
  check (char_length(btrim(name)) between 1 and 80);
alter table public.jobs drop constraint if exists jobs_skill_needed_check;
alter table public.jobs add constraint jobs_skill_needed_check
  check (skill_needed in ('gardening','domestic','piece_work'));
alter table public.jobs drop constraint if exists jobs_title_check;
alter table public.jobs add constraint jobs_title_check
  check (char_length(btrim(title)) between 1 and 120);

-- Replace the wide-open hackathon policies
alter table public.jobs enable row level security;
alter table public.workers enable row level security;
drop policy if exists "Allow public read access" on public.jobs;
drop policy if exists "Allow public insert access" on public.jobs;
drop policy if exists "Allow public read access" on public.workers;
drop policy if exists "Allow public insert access" on public.workers;

-- Jobs: owner only
drop policy if exists "jobs_select_own" on public.jobs;
drop policy if exists "jobs_insert_own" on public.jobs;
drop policy if exists "jobs_update_own" on public.jobs;
drop policy if exists "jobs_delete_own" on public.jobs;
create policy "jobs_select_own" on public.jobs for select to authenticated
  using ((select auth.uid()) = employer_id);
create policy "jobs_insert_own" on public.jobs for insert to authenticated
  with check ((select auth.uid()) = employer_id);
create policy "jobs_update_own" on public.jobs for update to authenticated
  using ((select auth.uid()) = employer_id) with check ((select auth.uid()) = employer_id);
create policy "jobs_delete_own" on public.jobs for delete to authenticated
  using ((select auth.uid()) = employer_id);

-- Workers: owner only
drop policy if exists "workers_select_own" on public.workers;
drop policy if exists "workers_insert_own" on public.workers;
drop policy if exists "workers_update_own" on public.workers;
drop policy if exists "workers_delete_own" on public.workers;
create policy "workers_select_own" on public.workers for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "workers_insert_own" on public.workers for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "workers_update_own" on public.workers for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workers_delete_own" on public.workers for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Matching: employers get name, skill and distance only (never raw coordinates),
-- and only for jobs they own
create or replace function public.match_workers_for_job(job_id uuid, radius_meters int default 5000)
returns table (worker_id uuid, name text, skill text, distance_meters float)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select w.id, w.name, w.skill, st_distance(w.location, j.location)
  from public.jobs j
  join public.workers w on w.skill = j.skill_needed
  where j.id = job_id
    and j.employer_id = (select auth.uid())
    and st_dwithin(w.location, j.location, least(radius_meters, 20000))
  order by st_distance(w.location, j.location)
  limit 20;
$$;

revoke execute on function public.match_workers_for_job(uuid, int) from public, anon;
grant execute on function public.match_workers_for_job(uuid, int) to authenticated;
revoke all on public.workers, public.jobs from anon;