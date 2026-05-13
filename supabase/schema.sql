create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════════════════
-- Street parking reports (existing)
-- ═══════════════════════════════════════════════════════

create table if not exists public.street_parking_reports (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  note text,
  photo_uri text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists street_parking_reports_active_idx
  on public.street_parking_reports (expires_at desc, created_at desc);

alter table public.street_parking_reports enable row level security;

create policy "Anyone can read active street parking reports"
  on public.street_parking_reports
  for select
  using (expires_at > now());

create policy "Authenticated users can insert street parking reports"
  on public.street_parking_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Anonymous clients can insert street parking reports"
  on public.street_parking_reports
  for insert
  to anon
  with check (user_id is null);

create policy "Report owners can update their own reports"
  on public.street_parking_reports
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Report owners can delete their own reports"
  on public.street_parking_reports
  for delete
  to authenticated
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════
-- Parking history & favorites
-- ═══════════════════════════════════════════════════════

create table if not exists public.parking_history (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null check (source in ('street', 'ispark', 'custom')),
  title text not null,
  lat double precision not null,
  lng double precision not null,
  address_hint text,
  lot_id integer,
  photo_uri text,
  parked_at timestamptz not null,
  ended_at timestamptz,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists parking_history_user_idx
  on public.parking_history (user_id, parked_at desc);

create index if not exists parking_history_favorites_idx
  on public.parking_history (user_id, is_favorite) where is_favorite = true;

alter table public.parking_history enable row level security;

create policy "Users can read their own history"
  on public.parking_history for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own history"
  on public.parking_history for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own history"
  on public.parking_history for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own history"
  on public.parking_history for delete to authenticated
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════
-- Admin-managed İSPARK tariffs
-- ═══════════════════════════════════════════════════════

create table if not exists public.parking_tariffs (
  id uuid primary key default gen_random_uuid(),
  park_id integer not null unique,
  park_name text not null,
  district text,
  hourly_rate decimal(10,2),
  daily_rate decimal(10,2),
  monthly_rate decimal(10,2),
  tariff_text text,
  free_minutes integer default 0,
  notes text,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parking_tariffs enable row level security;

create policy "Anyone can read tariffs"
  on public.parking_tariffs for select using (true);

create policy "Authenticated users can manage tariffs"
  on public.parking_tariffs for all to authenticated
  using (true) with check (true);


-- ═══════════════════════════════════════════════════════
-- Custom parking lots (AVM, hospitals, private, etc.)
-- ═══════════════════════════════════════════════════════

create table if not exists public.custom_parking_lots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('mall', 'hospital', 'private', 'other')),
  lat double precision not null,
  lng double precision not null,
  address text,
  district text,
  capacity integer not null default 0,
  empty_capacity integer not null default 0,
  is_free boolean not null default false,
  hourly_rate decimal(10,2),
  daily_rate decimal(10,2),
  monthly_rate decimal(10,2),
  tariff_text text,
  free_minutes integer default 0,
  work_hours text,
  phone text,
  website text,
  is_active boolean not null default true,
  manager_user_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_lots_active_idx
  on public.custom_parking_lots (is_active, category);

create index if not exists custom_lots_manager_idx
  on public.custom_parking_lots (manager_user_id);

alter table public.custom_parking_lots enable row level security;

-- Everyone can read active lots
create policy "Anyone can read active custom lots"
  on public.custom_parking_lots for select
  using (is_active = true);

-- Managers can update their own lot (capacity +/- and pricing)
create policy "Managers can update own lot"
  on public.custom_parking_lots for update to authenticated
  using (manager_user_id = auth.uid())
  with check (manager_user_id = auth.uid());

-- Authenticated users can insert new lots (admin use)
create policy "Authenticated users can insert custom lots"
  on public.custom_parking_lots for insert to authenticated
  with check (true);

-- Owners/creators can delete
create policy "Creators can delete custom lots"
  on public.custom_parking_lots for delete to authenticated
  using (created_by = auth.uid());

-- ═══════════════════════════════════════════════════════
-- User type management (manager vs regular user)
-- ═══════════════════════════════════════════════════════
-- To assign a user as a parking manager, run:
--   select set_user_as_manager('<user-uuid>', '<custom-lot-uuid>');
--
-- This sets user_metadata.user_type = 'manager' on their auth profile
-- and links them as the manager_user_id of the given custom lot.

create or replace function public.set_user_as_manager(
  target_user_id uuid,
  lot_id uuid
) returns void
language plpgsql
security definer
as $$
begin
  -- Update the user metadata to mark them as manager
  update auth.users
  set raw_user_meta_data = raw_user_meta_data || '{"user_type": "manager"}'::jsonb
  where id = target_user_id;

  -- Link the lot to this manager
  update public.custom_parking_lots
  set manager_user_id = target_user_id
  where id = lot_id;
end;
$$;

-- Revoke manager status
create or replace function public.revoke_manager(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update auth.users
  set raw_user_meta_data = raw_user_meta_data || '{"user_type": "user"}'::jsonb
  where id = target_user_id;

  update public.custom_parking_lots
  set manager_user_id = null
  where manager_user_id = target_user_id;
end;
$$;
