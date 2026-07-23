-- ============================================================
-- RUN-ONCE SETUP FOR LAUNCH  (safe to run anytime — idempotent)
-- Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- This creates/repairs EVERYTHING the app needs:
--   • profiles + progress (student data)
--   • leaderboard view (Level 1 dashboard)
--   • l1_questions (editable Level 1 question bank)
--   • student_credentials + admin powers (master-admin panel)
-- Every policy is dropped-if-exists first, so re-running never errors.
-- ============================================================

-- ---------- Core tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists class text not null default 'l2' check (class in ('l1','l2'));
alter table public.profiles add column if not exists username text;

create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

-- ---------- profiles policies ----------
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "admin profile select" on public.profiles;
create policy "admin profile select" on public.profiles for select using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
drop policy if exists "admin profile update" on public.profiles;
create policy "admin profile update" on public.profiles for update using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local'
) with check ((auth.jwt() ->> 'email') = 'admin@arduino-academy.local');

-- ---------- progress policies ----------
drop policy if exists "own progress select" on public.progress;
create policy "own progress select" on public.progress for select using (auth.uid() = user_id);
drop policy if exists "own progress insert" on public.progress;
create policy "own progress insert" on public.progress for insert with check (auth.uid() = user_id);
drop policy if exists "own progress update" on public.progress;
create policy "own progress update" on public.progress for update using (auth.uid() = user_id);
drop policy if exists "admin progress select" on public.progress;
create policy "admin progress select" on public.progress for select using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
drop policy if exists "admin progress delete" on public.progress;
create policy "admin progress delete" on public.progress for delete using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');

-- ---------- Leaderboard view (Level 1 dashboard) ----------
create or replace view public.leaderboard as
  select p.id, p.name, p.class, coalesce((pr.state->>'xp')::int, 0) as xp
  from public.profiles p
  left join public.progress pr on pr.user_id = p.id
  where p.role = 'student';
grant select on public.leaderboard to anon, authenticated;

-- ---------- Level 1 editable question bank ----------
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
drop policy if exists "l1q read" on public.l1_questions;
create policy "l1q read" on public.l1_questions for select using (true);
drop policy if exists "l1q admin insert" on public.l1_questions;
create policy "l1q admin insert" on public.l1_questions for insert with check (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
drop policy if exists "l1q admin update" on public.l1_questions;
create policy "l1q admin update" on public.l1_questions for update using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
drop policy if exists "l1q admin delete" on public.l1_questions;
create policy "l1q admin delete" on public.l1_questions for delete using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');

-- ---------- Master-admin credential book + powers ----------
-- SECURITY: stores each student's username+password in plaintext so the
-- teacher can recover them. Only the admin can read it (RLS below).
create table if not exists public.student_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text, username text, password text, class text,
  updated_at timestamptz not null default now()
);
alter table public.student_credentials enable row level security;
drop policy if exists "own cred insert" on public.student_credentials;
create policy "own cred insert" on public.student_credentials for insert with check (auth.uid() = user_id);
drop policy if exists "own cred update" on public.student_credentials;
create policy "own cred update" on public.student_credentials for update using (auth.uid() = user_id);
drop policy if exists "own cred select" on public.student_credentials;
create policy "own cred select" on public.student_credentials for select using (auth.uid() = user_id);
drop policy if exists "admin cred select" on public.student_credentials;
create policy "admin cred select" on public.student_credentials for select using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
drop policy if exists "admin cred update" on public.student_credentials;
create policy "admin cred update" on public.student_credentials for update using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
