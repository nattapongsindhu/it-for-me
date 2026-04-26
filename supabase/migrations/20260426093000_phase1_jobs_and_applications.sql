create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_key text not null unique,
  track_slug text not null,
  title text not null,
  company text not null,
  location_text text not null,
  zone text,
  remote_mode text,
  employment_type text,
  salary_text text,
  salary_min numeric,
  salary_max numeric,
  posted_date date,
  url text not null,
  description text,
  status text not null default 'OPEN',
  lat numeric,
  lng numeric,
  discovered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_track_slug_check
    check (track_slug in ('biomedical-device', 'it-helpdesk', 'facilities-tech')),
  constraint jobs_status_check
    check (status in ('OPEN', 'LIKELY_CLOSED', 'ARCHIVED'))
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  job_title_snapshot text not null,
  company_snapshot text not null,
  track_slug text not null,
  status text not null default 'SAVED',
  applied_date date,
  interview_date date,
  follow_up_date date,
  status_updated_at timestamptz not null default now(),
  notes text,
  contact_name text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_track_slug_check
    check (track_slug in ('biomedical-device', 'it-helpdesk', 'facilities-tech')),
  constraint applications_status_check
    check (status in ('SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'))
);

create index if not exists jobs_track_slug_posted_date_idx
  on public.jobs (track_slug, posted_date desc);

create index if not exists jobs_status_posted_date_idx
  on public.jobs (status, posted_date desc);

create index if not exists applications_status_applied_date_idx
  on public.applications (status, applied_date desc);

create index if not exists applications_interview_date_idx
  on public.applications (interview_date);

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

alter table public.jobs enable row level security;
alter table public.applications enable row level security;

drop policy if exists "jobs are readable by anyone using the public client" on public.jobs;
create policy "jobs are readable by anyone using the public client"
on public.jobs
for select
to anon, authenticated
using (true);

comment on table public.jobs is
  'Phase 1 source catalog for job listings imported from jobs.json and future fetch pipelines.';

comment on table public.applications is
  'Phase 1 personal job tracking table. Policies for write access can be added after the application flow is introduced.';
