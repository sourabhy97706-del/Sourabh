create table if not exists public.routine_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.routine_data enable row level security;
create policy "Users can read own routine" on public.routine_data for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own routine" on public.routine_data for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own routine" on public.routine_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);