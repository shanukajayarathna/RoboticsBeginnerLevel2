-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Sets up the tables + security rules for per-student logins and the admin dashboard.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

-- Everyone can read/insert their own profile row.
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- The fixed admin account can read every profile (for the dashboard).
create policy "admin profile select" on public.profiles for select using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
);

-- Everyone can read/write only their own progress row.
create policy "own progress select" on public.progress for select using (auth.uid() = user_id);
create policy "own progress insert" on public.progress for insert with check (auth.uid() = user_id);
create policy "own progress update" on public.progress for update using (auth.uid() = user_id);

-- The fixed admin account can read every student's progress (for the dashboard).
create policy "admin progress select" on public.progress for select using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
);
