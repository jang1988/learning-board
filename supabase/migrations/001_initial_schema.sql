-- Initial schema for Learning Board.
-- Run in Supabase SQL editor or through the Supabase CLI.

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

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'manager' check (role in ('manager', 'admin')),
  avatar_url text,
  department text,
  hired_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_required boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  type text not null default 'link' check (type in ('pdf', 'link', 'image', 'doc')),
  url text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  passing_score integer not null default 80 check (passing_score between 0 and 100),
  max_attempts integer not null default 3 check (max_attempts > 0),
  time_limit_sec integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  text text not null,
  type text not null check (type in ('single', 'multiple', 'text')),
  hint text,
  points integer not null default 1 check (points > 0),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  lessons_done integer not null default 0,
  lessons_total integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer not null default 0,
  max_score integer not null default 0,
  percent integer not null default 0 check (percent between 0 and 100),
  passed boolean not null default false,
  attempt_num integer not null check (attempt_num > 0),
  status text not null default 'reviewed' check (status in ('pending', 'reviewed')),
  time_spent_sec integer not null default 0,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.text_answers (
  id uuid primary key default gen_random_uuid(),
  quiz_result_id uuid not null references public.quiz_results(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer_text text not null,
  is_correct boolean,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_topics (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  order_index integer not null default 0,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  unique (module_id, topic_id)
);

create index if not exists idx_lessons_topic_order on public.lessons(topic_id, order_index);
create index if not exists idx_questions_quiz_order on public.questions(quiz_id, order_index);
create index if not exists idx_answers_question_order on public.answers(question_id, order_index);
create index if not exists idx_lesson_progress_user on public.lesson_progress(user_id);
create index if not exists idx_topic_progress_user on public.topic_progress(user_id);
create index if not exists idx_quiz_results_user_quiz on public.quiz_results(user_id, quiz_id, attempt_num);
create index if not exists idx_text_answers_review on public.text_answers(is_correct, created_at);
create index if not exists idx_module_topics_module_order on public.module_topics(module_id, order_index);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_topics_updated_at on public.topics;
create trigger set_topics_updated_at before update on public.topics
for each row execute function public.set_updated_at();

drop trigger if exists set_lessons_updated_at on public.lessons;
create trigger set_lessons_updated_at before update on public.lessons
for each row execute function public.set_updated_at();

drop trigger if exists set_quizzes_updated_at on public.quizzes;
create trigger set_quizzes_updated_at before update on public.quizzes
for each row execute function public.set_updated_at();

drop trigger if exists set_questions_updated_at on public.questions;
create trigger set_questions_updated_at before update on public.questions
for each row execute function public.set_updated_at();

drop trigger if exists set_lesson_progress_updated_at on public.lesson_progress;
create trigger set_lesson_progress_updated_at before update on public.lesson_progress
for each row execute function public.set_updated_at();

drop trigger if exists set_topic_progress_updated_at on public.topic_progress;
create trigger set_topic_progress_updated_at before update on public.topic_progress
for each row execute function public.set_updated_at();

drop trigger if exists set_modules_updated_at on public.modules;
create trigger set_modules_updated_at before update on public.modules
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1), 'User'),
    'manager'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.lessons enable row level security;
alter table public.materials enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.topic_progress enable row level security;
alter table public.quiz_results enable row level security;
alter table public.text_answers enable row level security;
alter table public.modules enable row level security;
alter table public.module_topics enable row level security;

create policy "profiles select own or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

create policy "profiles insert own" on public.profiles
for insert with check (id = auth.uid());

create policy "profiles update own basic or admin" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "content read authenticated" on public.topics
for select using (auth.role() = 'authenticated');

create policy "lessons read authenticated" on public.lessons
for select using (auth.role() = 'authenticated');

create policy "materials read authenticated" on public.materials
for select using (auth.role() = 'authenticated');

create policy "quizzes read authenticated" on public.quizzes
for select using (auth.role() = 'authenticated');

create policy "questions read authenticated" on public.questions
for select using (auth.role() = 'authenticated');

create policy "answers read admin only" on public.answers
for select using (public.is_admin());

create policy "modules read authenticated" on public.modules
for select using (auth.role() = 'authenticated');

create policy "module topics read authenticated" on public.module_topics
for select using (auth.role() = 'authenticated');

create policy "topics admin write" on public.topics
for all using (public.is_admin()) with check (public.is_admin());

create policy "lessons admin write" on public.lessons
for all using (public.is_admin()) with check (public.is_admin());

create policy "materials admin write" on public.materials
for all using (public.is_admin()) with check (public.is_admin());

create policy "quizzes admin write" on public.quizzes
for all using (public.is_admin()) with check (public.is_admin());

create policy "questions admin write" on public.questions
for all using (public.is_admin()) with check (public.is_admin());

create policy "answers admin write" on public.answers
for all using (public.is_admin()) with check (public.is_admin());

create policy "modules admin write" on public.modules
for all using (public.is_admin()) with check (public.is_admin());

create policy "module topics admin write" on public.module_topics
for all using (public.is_admin()) with check (public.is_admin());

create policy "lesson progress select own or admin" on public.lesson_progress
for select using (user_id = auth.uid() or public.is_admin());

create policy "lesson progress upsert own" on public.lesson_progress
for insert with check (user_id = auth.uid());

create policy "lesson progress update own or admin" on public.lesson_progress
for update using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "topic progress select own or admin" on public.topic_progress
for select using (user_id = auth.uid() or public.is_admin());

create policy "topic progress upsert own" on public.topic_progress
for insert with check (user_id = auth.uid());

create policy "topic progress update own or admin" on public.topic_progress
for update using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "quiz results select own or admin" on public.quiz_results
for select using (user_id = auth.uid() or public.is_admin());

create policy "quiz results insert own" on public.quiz_results
for insert with check (user_id = auth.uid());

create policy "quiz results update admin" on public.quiz_results
for update using (public.is_admin()) with check (public.is_admin());

create policy "text answers select own or admin" on public.text_answers
for select using (user_id = auth.uid() or public.is_admin());

create policy "text answers insert own" on public.text_answers
for insert with check (user_id = auth.uid());

create policy "text answers update admin" on public.text_answers
for update using (public.is_admin()) with check (public.is_admin());
