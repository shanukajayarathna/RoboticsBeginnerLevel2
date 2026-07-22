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

-- ---------------------------------------------------------------------
-- Two-class support (Level 1 self-signup + Level 2 existing roster).
-- Safe to re-run: only adds columns if they don't already exist.
-- Run this in the Supabase SQL Editor once before Level 1 signup is used.
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists class text not null default 'l2' check (class in ('l1','l2'));
alter table public.profiles add column if not exists username text;

-- ---------------------------------------------------------------------
-- Leaderboard view (for the Level 1 student dashboard).
-- Exposes ONLY each student's display name, class, and XP — never the
-- full progress blob or anything sensitive. Runs with definer privileges
-- so classmates can be ranked without opening up the RLS-protected
-- progress rows. Safe to re-run. Run once in the Supabase SQL Editor.
-- ---------------------------------------------------------------------
create or replace view public.leaderboard as
  select p.id, p.name, p.class, coalesce((pr.state->>'xp')::int, 0) as xp
  from public.profiles p
  left join public.progress pr on pr.user_id = p.id
  where p.role = 'student';
grant select on public.leaderboard to anon, authenticated;

-- ---------------------------------------------------------------------
-- Level 1 editable question bank (admin can add/edit/delete questions in
-- the app). Students read; only the admin can write. Safe to re-run.
-- Run once in the Supabase SQL Editor before using the "Manage Level 1"
-- editor. The app falls back to the bundled data/l1/questions.json until
-- this table has rows (use "Import starter questions" to seed it).
-- ---------------------------------------------------------------------
create table if not exists public.l1_questions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  difficulty text not null default 'Easy',
  type text not null default 'MCQ',
  question text not null,
  options jsonb not null default '[]'::jsonb,
  answer text not null,
  explanation text default '',
  hint1 text default '', hint2 text default '', hint3 text default '',
  animation text,
  xp int not null default 10,
  marks int not null default 1,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.l1_questions enable row level security;

-- Everyone (students, before login too) can read the questions.
create policy "l1q read" on public.l1_questions for select using (true);

-- Only the fixed admin account can add / change / remove questions.
create policy "l1q admin insert" on public.l1_questions for insert with check (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
);
create policy "l1q admin update" on public.l1_questions for update using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
);
create policy "l1q admin delete" on public.l1_questions for delete using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
);

-- ---------------------------------------------------------------------
-- MASTER ADMIN: account management + student credential book.
-- Run once in the Supabase SQL Editor. Safe to re-run.
--
-- SECURITY NOTE: student_credentials stores each student's username and
-- password IN PLAINTEXT so the teacher/master-admin can recover them for
-- young learners who forget. Supabase Auth itself only keeps a one-way
-- hash, so this is the only way to show a real password. RLS below means
-- ONLY the master-admin account can read this table; each student may
-- write only their own row. The app fills it in as students log in.
-- ---------------------------------------------------------------------
create table if not exists public.student_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  username text,
  password text,
  class text,
  updated_at timestamptz not null default now()
);

alter table public.student_credentials enable row level security;

-- Each user may create / update ONLY their own credential row.
create policy "own cred insert" on public.student_credentials for insert with check (auth.uid() = user_id);
create policy "own cred update" on public.student_credentials for update using (auth.uid() = user_id);
create policy "own cred select" on public.student_credentials for select using (auth.uid() = user_id);
-- Only the master admin can read the whole credential book.
create policy "admin cred select" on public.student_credentials for select using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
);

-- Let the master admin MANAGE accounts from the app:
--   • change a student's class (l1 <-> l2)   -> profiles update
--   • reset a student's progress             -> progress delete
create policy "admin profile update" on public.profiles for update using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
) with check (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
);
create policy "admin progress delete" on public.progress for delete using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
);
create policy "admin cred update" on public.student_credentials for update using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
);
