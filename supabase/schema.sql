create extension if not exists "pgcrypto";

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
