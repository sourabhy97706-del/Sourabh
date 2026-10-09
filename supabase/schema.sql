-- Sourabh Daily Routine: one private tracker record per authenticated user.
create table if not exists public.user_tracker_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  undo_data jsonb,
  active_day integer not null default 1 check (active_day between 1 and 30),
  total_habits integer not null default 11,
  report_email text not null default 'sourabhy97706@gmail.com',
  auto_report_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_tracker_data enable row level security;

drop policy if exists "Users can read own tracker" on public.user_tracker_data;
create policy "Users can read own tracker"
  on public.user_tracker_data for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tracker" on public.user_tracker_data;
create policy "Users can insert own tracker"
  on public.user_tracker_data for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tracker" on public.user_tracker_data;
create policy "Users can update own tracker"
  on public.user_tracker_data for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No public or anonymous access policies are intentionally created.
