create table if not exists public.site_config (
  id text primary key default 'default',
  config jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  guest_count integer not null default 1,
  guest_limit integer not null default 1,
  email text not null,
  attendance text not null check (attendance in ('Pending', 'Attending', 'Not Attending')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.rsvps
  add column if not exists guest_count integer not null default 1;

alter table public.rsvps
  add column if not exists guest_limit integer not null default 1;

alter table public.rsvps
  drop constraint if exists rsvps_guest_limit_check;

alter table public.rsvps
  add constraint rsvps_guest_limit_check
  check (guest_limit >= 1);

alter table public.rsvps
  drop constraint if exists rsvps_attendance_check;

alter table public.rsvps
  add constraint rsvps_attendance_check
  check (attendance in ('Pending', 'Attending', 'Not Attending'));

create table if not exists public.registry_items (
  id uuid primary key default gen_random_uuid(),
  site text not null,
  title text not null,
  description text not null,
  link text not null default '#',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_config enable row level security;
alter table public.rsvps enable row level security;
alter table public.registry_items enable row level security;

drop policy if exists "Read site config" on public.site_config;
create policy "Read site config"
  on public.site_config for select
  using (true);

drop policy if exists "Read registry items" on public.registry_items;
create policy "Read registry items"
  on public.registry_items for select
  using (true);

drop policy if exists "Create RSVP responses" on public.rsvps;
create policy "Create RSVP responses"
  on public.rsvps for insert
  with check (true);

-- Dashboard write policies for a static site. Use cautiously: anyone with the
-- public anon key can write these tables. For production, protect the dashboard
-- behind Supabase Auth and replace these policies with authenticated-only rules.
drop policy if exists "Dashboard can manage RSVP responses" on public.rsvps;
create policy "Dashboard can manage RSVP responses"
  on public.rsvps for all
  using (true)
  with check (true);

drop policy if exists "Dashboard can manage registry items" on public.registry_items;
create policy "Dashboard can manage registry items"
  on public.registry_items for all
  using (true)
  with check (true);

drop policy if exists "Dashboard can manage site config" on public.site_config;
create policy "Dashboard can manage site config"
  on public.site_config for all
  using (true)
  with check (true);
