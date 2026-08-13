-- Learning Board schema — актуальный снимок из Supabase (project: onboarding-platform, hwvqlpultsgqtawavivj)
-- Сгенерировано автоматически на основе текущего состояния БД (13.08.2026).
-- ВАЖНО: в БД накопилось много дублирующих RLS-политик (старые + новые с одинаковым смыслом
-- под разными именами). Это НЕ ошибка синтаксиса, а реальное состояние — см. комментарий в конце файла.

create extension if not exists pgcrypto;

-- =========================================================
-- ENUM TYPES (в исходном файле их не было — раньше использовались text + check,
-- сейчас это настоящие enum'ы)
-- =========================================================

create type public.user_role as enum ('manager', 'admin');
create type public.progress_status as enum ('not_started', 'in_progress', 'completed');
create type public.question_type as enum ('single', 'multiple', 'text');
create type public.material_type as enum ('pdf', 'link', 'image', 'doc');

-- =========================================================
-- FUNCTIONS
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Дубликат set_updated_at с другим именем, тоже используется триггерами ниже
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin new.updated_at = now(); return new; end;
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

-- Ещё одна функция с тем же смыслом, что is_admin(), но возвращает роль, а не boolean
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
as $$
  select role from profiles where id = auth.uid();
$$;

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

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role user_role not null default 'manager',
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
  cover_url text,                              -- новое поле
  is_required boolean default true,
  order_index integer not null default 0,
  created_by uuid references public.profiles(id),  -- новое поле
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  duration_sec integer,                         -- новое поле
  order_index integer not null default 0,
  created_at timestamptz not null default now()
  -- updated_at и триггер на неё в текущей БД отсутствуют
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  file_url text not null,                       -- переименовано из url
  file_type text,                               -- переименовано из type, тип enum material_type больше не используется как constraint колонки
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  passing_score integer not null default 80,     -- дефолт изменился с 80 на 70
  max_attempts integer default 3,
  time_limit_sec integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  text text not null,
  type question_type default 'single',
  -- поле hint удалено
  points integer default 1,
  order_index integer not null default 0
  -- created_at / updated_at и триггер updated_at в текущей БД отсутствуют
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  text text not null,
  is_correct boolean default false,
  order_index integer not null default 0
  -- created_at в текущей БД отсутствует
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status progress_status default 'not_started',
  watch_time_sec integer default 0,              -- новое поле
  completed_at timestamptz,
  unique (user_id, lesson_id)
  -- created_at отсутствует, updated_at есть только неявно (используется в триггере, но колонки нет в списке — проверьте вручную)
);

create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  status progress_status default 'not_started',
  lessons_done integer default 0,
  lessons_total integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer,
  max_score integer not null,
  percent integer,
  passed boolean,
  attempt_num integer not null default 1,
  status text default 'pending',                 -- раньше был check ('pending','reviewed'), сейчас просто text без constraint
  time_spent_sec integer,
  submitted_at timestamptz default now()
  -- created_at в текущей БД отсутствует
);

create table if not exists public.text_answers (
  id uuid primary key default gen_random_uuid(),
  quiz_result_id uuid not null references public.quiz_results(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer_text text not null,
  is_correct boolean,
  reviewed_by uuid references public.profiles(id),  -- новое поле
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Новая таблица, которой не было в исходной схеме
create table if not exists public.quiz_user_answers (
  id uuid primary key default gen_random_uuid(),
  quiz_result_id uuid not null references public.quiz_results(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_id uuid references public.answers(id),
  user_id uuid not null references public.profiles(id) on delete cascade,
  text_answer text,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index integer not null default 0,
  color text,                                    -- новое поле
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

-- =========================================================
-- TRIGGERS
-- ВНИМАНИЕ: на нескольких таблицах сейчас висит ПО ДВА триггера с одинаковым эффектом
-- (один зовёт set_updated_at(), другой — update_updated_at()). Это дублирование,
-- оставлено как есть, чтобы файл отражал реальное состояние БД.
-- =========================================================

create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at();

create trigger set_topics_updated_at before update on public.topics
for each row execute function public.set_updated_at();
create trigger topics_updated_at before update on public.topics
for each row execute function public.update_updated_at();

create trigger set_quizzes_updated_at before update on public.quizzes
for each row execute function public.set_updated_at();

create trigger set_questions_updated_at before update on public.questions
for each row execute function public.set_updated_at();

create trigger set_lesson_progress_updated_at before update on public.lesson_progress
for each row execute function public.set_updated_at();

create trigger set_topic_progress_updated_at before update on public.topic_progress
for each row execute function public.set_updated_at();

create trigger set_modules_updated_at before update on public.modules
for each row execute function public.set_updated_at();
create trigger modules_updated_at before update on public.modules
for each row execute function public.update_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

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
alter table public.quiz_user_answers enable row level security;

-- ---- profiles ----
create policy "profiles select own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "Users select own profile on login" on public.profiles for select using (id = auth.uid());
create policy "Users see own profile" on public.profiles for select using (id = auth.uid());
create policy "Admin sees all profiles" on public.profiles for select using (current_user_role() = 'admin');
create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid());
create policy "Users insert own profile" on public.profiles for insert with check (id = auth.uid());
create policy "profiles update own basic or admin" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "Users update own profile" on public.profiles for update using (id = auth.uid());
create policy "Admin manages profiles" on public.profiles for all using (current_user_role() = 'admin');

-- ---- topics ----
create policy "content read authenticated" on public.topics for select using (auth.role() = 'authenticated');
create policy "All read topics" on public.topics for select using (auth.uid() is not null);
create policy "topics admin write" on public.topics for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write topics" on public.topics for all using (current_user_role() = 'admin');

-- ---- lessons ----
create policy "lessons read authenticated" on public.lessons for select using (auth.role() = 'authenticated');
create policy "All read lessons" on public.lessons for select using (auth.uid() is not null);
create policy "lessons admin write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write lessons" on public.lessons for all using (current_user_role() = 'admin');

-- ---- materials ----
create policy "materials read authenticated" on public.materials for select using (auth.role() = 'authenticated');
create policy "public read materials" on public.materials for select using (true);
create policy "materials admin write" on public.materials for all using (public.is_admin()) with check (public.is_admin());

-- ---- quizzes ----
create policy "quizzes read authenticated" on public.quizzes for select using (auth.role() = 'authenticated');
create policy "All read quizzes" on public.quizzes for select using (auth.uid() is not null);
create policy "quizzes admin write" on public.quizzes for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write quizzes" on public.quizzes for all using (current_user_role() = 'admin');

-- ---- questions ----
create policy "questions read authenticated" on public.questions for select using (auth.role() = 'authenticated');
create policy "All read questions" on public.questions for select using (auth.uid() is not null);
create policy "questions admin write" on public.questions for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write questions" on public.questions for all using (current_user_role() = 'admin');

-- ---- answers ----
create policy "answers read admin only" on public.answers for select using (public.is_admin());
create policy "All read answers" on public.answers for select using (auth.uid() is not null);
create policy "answers admin write" on public.answers for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write answers" on public.answers for all using (current_user_role() = 'admin');

-- ---- modules ----
create policy "modules read authenticated" on public.modules for select using (auth.role() = 'authenticated');
create policy "modules select" on public.modules for select using (true);
create policy "modules insert" on public.modules for insert with check (true);
create policy "Admins can delete modules" on public.modules for delete using (true);
create policy "modules admin write" on public.modules for all using (public.is_admin()) with check (public.is_admin());

-- ---- module_topics ----
create policy "module topics read authenticated" on public.module_topics for select using (auth.role() = 'authenticated');
create policy "Enable read access for all users" on public.module_topics for select using (true);
create policy "module_topics_select" on public.module_topics for select using (true);
create policy "Enable insert for authenticated users only" on public.module_topics for insert with check (true);
create policy "module_topics_insert" on public.module_topics for insert with check (true);
create policy "module_topics_update" on public.module_topics for update using (true) with check (true);
create policy "module_topics_delete" on public.module_topics for delete using (true);
create policy "module topics admin write" on public.module_topics for all using (public.is_admin()) with check (public.is_admin());

-- ---- lesson_progress ----
create policy "lesson progress select own or admin" on public.lesson_progress for select using (user_id = auth.uid() or public.is_admin());
create policy "User sees own lesson_progress" on public.lesson_progress for select using (user_id = auth.uid() or current_user_role() = 'admin');
create policy "lesson progress upsert own" on public.lesson_progress for insert with check (user_id = auth.uid());
create policy "lesson progress update own or admin" on public.lesson_progress for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "User writes own lesson_progress" on public.lesson_progress for all using (user_id = auth.uid());

-- ---- topic_progress ----
create policy "topic progress select own or admin" on public.topic_progress for select using (user_id = auth.uid() or public.is_admin());
create policy "User sees own topic_progress" on public.topic_progress for select using (user_id = auth.uid() or current_user_role() = 'admin');
create policy "topic progress upsert own" on public.topic_progress for insert with check (user_id = auth.uid());
create policy "topic progress update own or admin" on public.topic_progress for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "User writes own topic_progress" on public.topic_progress for all using (user_id = auth.uid());

-- ---- quiz_results ----
create policy "quiz results select own or admin" on public.quiz_results for select using (user_id = auth.uid() or public.is_admin());
create policy "User sees own results" on public.quiz_results for select using (user_id = auth.uid() or current_user_role() = 'admin');
create policy "quiz results insert own" on public.quiz_results for insert with check (user_id = auth.uid());
create policy "User submits results" on public.quiz_results for insert with check (user_id = auth.uid());
create policy "quiz results update admin" on public.quiz_results for update using (public.is_admin()) with check (public.is_admin());
create policy "Admin updates quiz_results" on public.quiz_results for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- ---- text_answers ----
create policy "text answers select own or admin" on public.text_answers for select using (user_id = auth.uid() or public.is_admin());
create policy "select_text_answers" on public.text_answers for select using (
  user_id = auth.uid() or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "text answers insert own" on public.text_answers for insert with check (user_id = auth.uid());
create policy "insert_text_answers" on public.text_answers for insert with check (user_id = auth.uid());
create policy "text answers update admin" on public.text_answers for update using (public.is_admin()) with check (public.is_admin());
create policy "update_text_answers" on public.text_answers for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- ---- quiz_user_answers ----
-- В текущей БД RLS включён, но политики отсутствуют (значит по умолчанию доступ закрыт всем, кроме service_role)

-- =========================================================
-- INDEXES / UNIQUE CONSTRAINTS
-- =========================================================
-- lesson_progress: unique (user_id, lesson_id)   -- lesson_progress_user_id_lesson_id_key
-- topic_progress:  unique (user_id, topic_id)    -- topic_progress_user_id_topic_id_key
-- module_topics:   unique (module_id, topic_id)  -- module_topics_module_id_topic_id_key

-- =========================================================
-- ЧТО ИЗМЕНИЛОСЬ ПО СРАВНЕНИЮ С ВАШИМ СТАРЫМ ФАЙЛОМ (кратко)
-- =========================================================
-- 1. Появились enum-типы вместо text+check: user_role, progress_status, question_type, material_type.
-- 2. Новая таблица: quiz_user_answers.
-- 3. Новые колонки: topics.cover_url, topics.created_by, lessons.duration_sec,
--    lesson_progress.watch_time_sec, modules.color, text_answers.reviewed_by.
-- 4. materials: url -> file_url, type -> file_type (constraint по типу материала снят).
-- 5. Удалены колонки: questions.hint; несколько created_at/updated_at колонок пропали
--    у lessons, questions, answers, quiz_results.
-- 6. quizzes.passing_score дефолт изменился с 80 на 70.
-- 7. quiz_results.status теперь просто text без check-ограничения ('pending'/'reviewed').
-- 8. Появилась вторая версия функций is_admin() -> current_user_role(),
--    set_updated_at() -> update_updated_at() — обе используются параллельно, это дублирование.
-- 9. На каждую таблицу сейчас в среднем 2-4 RLS policy с одинаковым смыслом под разными
--    именами (старые "snake case with spaces" + новые "Human Readable" + auto-generated).
--    Рекомендую почистить дубли отдельной миграцией, когда будет время — сейчас файл
--    просто отражает реальное состояние, ничего не удаляя.