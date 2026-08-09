-- ============================================================
-- MOCK EXAM (Level 2) — run-once setup (safe to run anytime — idempotent)
-- Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Adds:
--   • l2_exam_questions   (editable Level 2 mock-exam question bank)
--   • l2_exam_submissions (one row per student attempt, answers + grading)
-- Every policy is dropped-if-exists first, so re-running never errors.
-- ============================================================

-- ---------- Question bank ----------
create table if not exists public.l2_exam_questions (
  id uuid primary key default gen_random_uuid(),
  part text not null check (part in ('A','B','C','D')),
  section_title text not null,
  order_num int not null default 0,
  type text not null check (type in ('mcq','short_answer','code','design')),
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  answer text,
  max_marks int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.l2_exam_questions enable row level security;

drop policy if exists "l2examq read" on public.l2_exam_questions;
create policy "l2examq read" on public.l2_exam_questions for select using (true);
drop policy if exists "l2examq admin insert" on public.l2_exam_questions;
create policy "l2examq admin insert" on public.l2_exam_questions for insert with check (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
drop policy if exists "l2examq admin update" on public.l2_exam_questions;
create policy "l2examq admin update" on public.l2_exam_questions for update using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
drop policy if exists "l2examq admin delete" on public.l2_exam_questions;
create policy "l2examq admin delete" on public.l2_exam_questions for delete using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');

-- ---------- Student submissions (one attempt per student) ----------
create table if not exists public.l2_exam_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','graded')),
  answers jsonb not null default '{}'::jsonb,
  marks jsonb not null default '{}'::jsonb,
  auto_score int not null default 0,
  total_score int,
  graded_by uuid references auth.users(id),
  graded_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.l2_exam_submissions enable row level security;

drop policy if exists "l2exams own select" on public.l2_exam_submissions;
create policy "l2exams own select" on public.l2_exam_submissions for select using (auth.uid() = user_id);
drop policy if exists "l2exams own insert" on public.l2_exam_submissions;
create policy "l2exams own insert" on public.l2_exam_submissions for insert with check (auth.uid() = user_id);
drop policy if exists "l2exams own update" on public.l2_exam_submissions;
create policy "l2exams own update" on public.l2_exam_submissions for update using (auth.uid() = user_id);
drop policy if exists "l2exams admin select" on public.l2_exam_submissions;
create policy "l2exams admin select" on public.l2_exam_submissions for select using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
drop policy if exists "l2exams admin update" on public.l2_exam_submissions;
create policy "l2exams admin update" on public.l2_exam_submissions for update using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
drop policy if exists "l2exams admin delete" on public.l2_exam_submissions;
create policy "l2exams admin delete" on public.l2_exam_submissions for delete using (
  (auth.jwt() ->> 'email') = 'admin@arduino-academy.local');
