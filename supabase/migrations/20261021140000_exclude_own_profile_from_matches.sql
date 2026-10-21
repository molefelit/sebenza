-- Matching: exclude the employer's own worker profile from their matches
-- (applied manually via the Supabase SQL Editor on 2026-10-21). Safe to re-run.

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
    and w.user_id <> (select auth.uid())
    and st_dwithin(w.location, j.location, least(radius_meters, 20000))
  order by st_distance(w.location, j.location)
  limit 20;
$$;

revoke execute on function public.match_workers_for_job(uuid, int) from public, anon;
grant execute on function public.match_workers_for_job(uuid, int) to authenticated;