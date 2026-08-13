# Learning Board — техническая документация

Внутренняя платформа онбординга и обучения сотрудников. Пользователь с ролью **manager** проходит темы, уроки и тесты; пользователь с ролью **admin** управляет контентом, сотрудниками, модулями и проверяет текстовые ответы.

---

## Содержание

1. [Стек технологий](#1-стек-технологий)
2. [Архитектура](#2-архитектура)
3. [Структура проекта](#3-структура-проекта)
4. [Роли и авторизация](#4-роли-и-авторизация)
5. [Схема базы данных](#5-схема-базы-данных)
6. [Row Level Security (RLS)](#6-row-level-security-rls)
7. [Слой данных (api / lib / hooks)](#7-слой-данных-api--lib--hooks)
8. [API-роуты](#8-api-роуты)
9. [Ключевые пользовательские сценарии](#9-ключевые-пользовательские-сценарии)
10. [Компонентная карта UI](#10-компонентная-карта-ui)
11. [Установка и запуск](#11-установка-и-запуск)
12. [Переменные окружения](#12-переменные-окружения)
13. [Деплой](#13-деплой)
14. [Проверка перед деплоем](#14-проверка-перед-деплоем)
15. [Заметки по безопасности](#15-заметки-по-безопасности)
16. [Известные особенности кода](#16-известные-особенности-кода)

---

## 1. Стек технологий

| Слой | Технология | Версия |
|---|---|---|
| Framework | Next.js (App Router, Server Components, Route Handlers, Proxy) | 16.2.4 |
| UI | React | 19.2.4 |
| Язык | TypeScript | ^5 |
| Стилизация | CSS Modules + Tailwind (postcss) | Tailwind ^4 |
| Иконки | lucide-react | ^1.17.0 |
| Скелетоны загрузки | react-loading-skeleton | ^3.5.0 |
| Backend / БД | Supabase (PostgreSQL, Auth, Storage через RLS) | @supabase/ssr ^0.10.2, @supabase/supabase-js ^2.105.3 |
| Линтер | ESLint (eslint-config-next) | ^9 |

Скрипты `package.json`:

```bash
npm run dev     # next dev — режим разработки
npm run build   # next build — production-сборка
npm run start   # next start — production-сервер
npm run lint    # eslint
```

---

## 2. Архитектура

```mermaid
flowchart TB
    subgraph Client["Браузер"]
        UI[React 19 Server/Client Components]
    end

    subgraph NextApp["Next.js 16 App Router"]
        Proxy["proxy.ts (middleware)\nроутинг по auth/role"]
        RSC["Server Components\napp/admin/**, app/manager/**"]
        RouteHandler["Route Handlers\napp/api/quiz/submit\napp/auth/callback"]
    end

    subgraph Supabase["Supabase"]
        Auth["Auth (email/password, OAuth)"]
        DB[("PostgreSQL + RLS")]
    end

    UI -->|HTTP| Proxy
    Proxy -->|проверка сессии/роли| Auth
    Proxy --> RSC
    RSC -->|anon key + cookies, под RLS| DB
    RSC -->|client-side upsert прогресса| Auth
    UI -->|fetch POST| RouteHandler
    RouteHandler -->|service role key, в обход RLS| DB
    RouteHandler --> Auth
```

**Принцип разделения ответственности:**

- **`proxy.ts`** — быстрый «оптимистичный» редирект на уровне edge-мидлвара: неавторизованных отправляет на `/auth/login`, авторизованных с auth-страниц — на дашборд по роли, менеджеров — из `/admin/*`.
- **Server Layouts** (`app/admin/layout.tsx`, `app/manager/layout.tsx`) — вторичная, «настоящая» проверка авторизации и роли перед рендером защищённой области (проверка в proxy — не единственная линия защиты).
- **Anon-клиент** (`lib/supabase/server.ts`, `lib/supabase/client.ts`) — используется почти везде, все запросы идут под RLS-политиками от лица текущего пользователя.
- **Admin-клиент** (`lib/supabase/admin.ts`, `SUPABASE_SERVICE_ROLE_KEY`) — используется **только** на сервере в `app/api/quiz/submit/route.ts`, чтобы прочитать `answers.is_correct` (RLS это запрещает обычным юзерам) и посчитать результат теста, не раскрывая правильные ответы клиенту.

---

## 3. Структура проекта

```
learning-board-main/
├── api/                       # Server-side data-fetch функции (Supabase-запросы)
│   ├── getDashboardData.ts
│   ├── getEmployeesUserPage.ts
│   ├── getGlobalStats.ts
│   ├── getQuizResults.ts
│   ├── getQuizzes.ts
│   ├── getTopicPageData.ts
│   ├── getTopicsData.ts
│   └── getUserDetails.ts
├── app/                        # Next.js App Router
│   ├── admin/                  # Защищённая зона администратора
│   │   ├── dashboard/
│   │   ├── modules/
│   │   ├── reports/
│   │   ├── text-answers/       # проверка текстовых ответов
│   │   ├── topics/[id]/        # редактор темы (уроки, тест)
│   │   ├── topics/new/
│   │   ├── users/[id]/         # карточка сотрудника
│   │   └── layout.tsx          # guard: только role === 'admin'
│   ├── manager/                 # Защищённая зона сотрудника
│   │   ├── dashboard/
│   │   ├── modules/[id]/
│   │   ├── results/
│   │   ├── topics/[id]/
│   │   │   └── quiz/            # прохождение теста
│   │   └── layout.tsx           # guard: любой авторизованный
│   ├── api/quiz/submit/route.ts # POST — приём и проверка теста
│   ├── auth/
│   │   ├── callback/route.ts    # OAuth/magic-link callback
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── layout.tsx               # root layout
│   └── page.tsx                 # redirect → /auth/login
├── components/                  # UI-компоненты, сгруппированы по фиче
│   ├── adminManegerCard/        # карточки сотрудников (admin)
│   ├── adminManegerStat/        # статистика по сотруднику (admin)
│   ├── adminModules/            # управление модулями (admin)
│   ├── layout/                  # Sidebar, DashboardShell, фон
│   ├── managerDashboard/        # виджеты дашборда менеджера
│   ├── managerModules/          # просмотр модуля (manager)
│   ├── managerQuiz/             # прохождение теста (manager)
│   ├── managerTopicPage/        # страница темы (manager)
│   ├── managerTopics/           # список тем (manager)
│   ├── skeleton/                # скелетоны загрузки
│   └── video/                   # видеоплеер урока
├── hooks/                       # клиентские React-хуки
├── lib/
│   ├── admin/                   # чистые функции-калькуляторы для admin
│   ├── manager/                 # чистые функции-калькуляторы + мутации для manager
│   └── supabase/                # фабрики Supabase-клиентов (browser/server/admin)
├── supabase/migrations/
│   └── 001_initial_schema.sql   # единственная миграция — вся схема + RLS
├── styles/globals.css
├── types/index.ts               # все TS-типы (DB + UI)
├── proxy.ts                     # Next.js middleware
└── next.config.ts
```

---

## 4. Роли и авторизация

| Роль | Доступ | Начальная страница |
|---|---|---|
| `manager` (по умолчанию для новых пользователей) | `/manager/*` — темы, уроки, тесты, свои результаты | `/manager/dashboard` |
| `admin` | `/admin/*` + всё, что доступно manager | `/admin/dashboard` |

**Поток регистрации/входа:**

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant P as proxy.ts
    participant SB as Supabase Auth
    participant CB as /auth/callback
    participant L as Layout (admin/manager)
    participant DB as PostgreSQL (profiles)

    U->>SB: sign up / sign in (email+password или OAuth)
    SB-->>CB: redirect с ?code=...
    CB->>SB: exchangeCodeForSession(code)
    CB->>DB: select profiles by id
    alt профиля нет
        CB->>DB: insert profiles (role='manager')
        CB-->>U: redirect /manager/dashboard
    else профиль есть
        CB-->>U: redirect по роли
    end

    Note over U,P: Дальнейшие переходы по сайту
    U->>P: GET /admin/... или /manager/...
    P->>SB: getUser() (по cookies)
    P->>DB: select role from profiles
    alt не авторизован
        P-->>U: redirect /auth/login
    else auth page, но уже вошёл
        P-->>U: redirect на дашборд по роли
    else /admin/*, а роль manager
        P-->>U: redirect /manager/dashboard
    else доступ разрешён
        P-->>L: NextResponse.next()
        L->>DB: повторная проверка роли (server layout)
        L-->>U: рендер защищённой страницы
    end
```

Автоматическое создание профиля дублируется в трёх местах для надёжности:

1. **SQL-триггер `handle_new_user()`** на `auth.users` (миграция) — основной путь, роль `manager` по умолчанию.
2. **`app/auth/callback/route.ts`** — на случай если триггер ещё не сработал/OAuth-флоу.
3. **`app/manager/layout.tsx`** — финальный fallback перед рендером, если профиля всё ещё нет.

Первый администратор назначается вручную SQL-запросом (см. [раздел 11](#11-установка-и-запуск)).

---

## 5. Схема базы данных

```mermaid
erDiagram
    PROFILES ||--o{ TOPIC_PROGRESS : "1"
    PROFILES ||--o{ LESSON_PROGRESS : "1"
    PROFILES ||--o{ QUIZ_RESULTS : "1"
    PROFILES ||--o{ TEXT_ANSWERS : "1"

    TOPICS ||--o{ LESSONS : "1"
    TOPICS ||--o{ QUIZZES : "1"
    TOPICS ||--o{ TOPIC_PROGRESS : "1"
    TOPICS ||--o{ MODULE_TOPICS : "1"

    LESSONS ||--o{ MATERIALS : "1"
    LESSONS ||--o{ LESSON_PROGRESS : "1"

    QUIZZES ||--o{ QUESTIONS : "1"
    QUIZZES ||--o{ QUIZ_RESULTS : "1"

    QUESTIONS ||--o{ ANSWERS : "1"
    QUESTIONS ||--o{ TEXT_ANSWERS : "1"

    QUIZ_RESULTS ||--o{ TEXT_ANSWERS : "1"

    MODULES ||--o{ MODULE_TOPICS : "1"

    PROFILES {
        uuid id PK
        text full_name
        text email UK
        text role "manager|admin"
        text avatar_url
        text department
        date hired_at
    }
    TOPICS {
        uuid id PK
        text title
        text description
        boolean is_required
        int order_index
    }
    LESSONS {
        uuid id PK
        uuid topic_id FK
        text title
        text video_url
        int order_index
    }
    MATERIALS {
        uuid id PK
        uuid lesson_id FK
        text type "pdf|link|image|doc"
        text url
    }
    QUIZZES {
        uuid id PK
        uuid topic_id FK
        text title
        int passing_score
        int max_attempts
        int time_limit_sec
    }
    QUESTIONS {
        uuid id PK
        uuid quiz_id FK
        text type "single|multiple|text"
        int points
    }
    ANSWERS {
        uuid id PK
        uuid question_id FK
        boolean is_correct "скрыто RLS от manager"
    }
    LESSON_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        text status "not_started|in_progress|completed"
    }
    TOPIC_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        text status
        int lessons_done
        int lessons_total
    }
    QUIZ_RESULTS {
        uuid id PK
        uuid user_id FK
        uuid quiz_id FK
        int percent
        boolean passed
        int attempt_num
        text status "pending|reviewed"
    }
    TEXT_ANSWERS {
        uuid id PK
        uuid quiz_result_id FK
        uuid question_id FK
        uuid user_id FK
        text answer_text
        boolean is_correct "null = ещё не проверено"
    }
    MODULES {
        uuid id PK
        text title
        int order_index
    }
    MODULE_TOPICS {
        uuid id PK
        uuid module_id FK
        uuid topic_id FK
        boolean is_required
    }
```

Все таблицы (кроме `materials`, `answers`, `module_topics`) имеют `created_at`; таблицы с изменяемым состоянием (`profiles`, `topics`, `lessons`, `quizzes`, `questions`, `lesson_progress`, `topic_progress`, `modules`) дополнительно имеют `updated_at`, автоматически обновляемый триггером `set_updated_at()`.

Уникальные ограничения:
- `lesson_progress (user_id, lesson_id)` — один статус прогресса на пару юзер/урок.
- `topic_progress (user_id, topic_id)` — один агрегат прогресса на пару юзер/тема.
- `module_topics (module_id, topic_id)` — тема не дублируется внутри модуля.

Индексы для типичных выборок: `lessons(topic_id, order_index)`, `questions(quiz_id, order_index)`, `answers(question_id, order_index)`, `lesson_progress(user_id)`, `topic_progress(user_id)`, `quiz_results(user_id, quiz_id, attempt_num)`, `text_answers(is_correct, created_at)` (для очереди на проверку), `module_topics(module_id, order_index)`.

---

## 6. Row Level Security (RLS)

RLS включён на всех таблицах. Ключевая функция-хелпер:

```sql
is_admin() → boolean   -- SECURITY DEFINER, проверяет profiles.role = 'admin' для auth.uid()
```

| Таблица | SELECT | INSERT/UPDATE |
|---|---|---|
| `profiles` | своя запись или admin | своя запись (insert), своя или admin (update) |
| `topics / lessons / materials / quizzes / questions / modules / module_topics` | любой `authenticated` | только admin |
| `answers` | **только admin** (`is_correct` не должен утекать к manager) | только admin |
| `lesson_progress / topic_progress` | своя запись или admin | insert/update — только своя запись (или admin на update) |
| `quiz_results` | своя запись или admin | insert — своя запись; update — только admin (проверка текстовых ответов) |
| `text_answers` | своя запись или admin | insert — своя запись; update — только admin |

Именно из-за политики `answers read admin only` для проверки теста используется **отдельный серверный клиент с service-role ключом** (см. раздел 8) — обычный anon-клиент от лица manager физически не сможет прочитать `is_correct`.

---

## 7. Слой данных (api / lib / hooks)

Проект придерживается трёхслойной модели для загрузки и обработки данных:

```mermaid
flowchart LR
    subgraph "1. api/*.ts"
        A[Server Component]-->B["Supabase select() /\nRPC-запросы"]
    end
    subgraph "2. lib/manager, lib/admin"
        B-->C["Чистые функции:\nenrichTopics, calcLessonsProgress,\ncalculateUserStats, mapEmployees..."]
    end
    subgraph "3. hooks/*.ts"
        C-->D["Клиентские React-хуки:\nuseLessonProgress, useQuizTimer,\nuseQuizSecurity..."]
    end
    D-->E[UI-компонент]
```

### `api/` — загрузка данных с сервера

| Файл | Назначение |
|---|---|
| `getDashboardData.ts` | Профиль + все темы (с прогрессом уроков) + 3 последних результата тестов для дашборда manager |
| `getTopicsData.ts` | Список всех тем с уроками, прогрессом, тестами, привязанным модулем |
| `getTopicPageData.ts` | Данные одной темы: тема, уроки (материалы + прогресс текущего юзера через `.eq('lesson_progress.user_id', userId)`), тест, последний результат теста; агрегирует всё через `buildTopicProgress` |
| `getQuizzes.ts` | `getQuizByTopicId` — тест с вопросами и ответами (используется на серверных страницах для admin) |
| `getQuizResults.ts` | `getQuizAttemptsCount` — подсчёт использованных попыток (нужен для контроля лимита `max_attempts`) |
| `getGlobalStats.ts` | Общее число тем и уроков (для карточек статистики) |
| `getEmployeesUserPage.ts` | Список сотрудников с прогрессом и результатами тестов — с guard-редиректом, если вызывающий не admin |
| `getUserDetails.ts` | Полная карточка сотрудника: прогресс по темам/урокам, все результаты тестов |

### `lib/manager/` — расчёты и мутации на стороне manager

| Файл | Назначение |
|---|---|
| `calcLessonsProgress.ts` | Считает `total/done/percent/isCompleted/isStarted` по урокам темы; поддерживает 2 режима (данные уже отфильтрованы по юзеру на SQL-уровне / нужно фильтровать вручную по массиву юзеров) |
| `calcTopicProgress.ts` | `enrichTopicsWithProgress` — обогащает список тем статусом (`not_started/in_progress/completed`) для конкретного юзера |
| `enrichTopics.ts` | Альтернативный обогатитель тем — используется там, где также нужны `hasQuiz`, цвет и название модуля |
| `buildTopicProgress.ts` | Сводит прогресс уроков + результат теста в единый `TopicProgress` (включая `quizDisplayStatus`: none/pending/reviewed/passed/failed) для страницы темы |
| `calculateQuizResult.ts` | Чистая функция подсчёта результата теста: сравнивает выбранные ответы с `is_correct`-ответами, считает `earned/maxScore/percent` |
| `sanitizeQuiz.ts` | Убирает `is_correct` из ответов и сортирует вопросы/ответы по `order_index` перед отдачей теста на клиент |
| `completeLesson.ts` | Client-side мутация: upsert `lesson_progress` (`completed`) → upsert `topic_progress` (пересчитывает статус темы) |
| `fullscreen.ts` | Обёртки над Fullscreen API (`enterFullscreen`/`exitFullscreen`) для защищённого прохождения теста |

### `lib/admin/` — расчёты для админской панели

| Файл | Назначение |
|---|---|
| `calculateUserStats.ts` | Статистика одного сотрудника: завершённые темы/уроки, средний балл по проверенным тестам |
| `mapEmployees.ts` | Обогащает список сотрудников процентом прохождения и средним баллом для таблицы/грида на `/admin/users` |

### `hooks/` — клиентские React-хуки

| Хук | Назначение |
|---|---|
| `useDashboard.ts` | `getDashboardViewModel` — server-side view-model для дашборда manager (агрегирует `getDashboardData` + `enrichTopicsWithProgress` + статистику по статусам) |
| `useLessonProgress.ts` | Optimistic-UI отметка урока как пройденного, с откатом при ошибке сети |
| `useTopicProgress.ts` | Локальное состояние прогресса темы (набор пройденных уроков, процент) на стороне клиента |
| `useQuizAccess.ts` | Вычисляет `canStartQuiz`/`isLocked` на основе статуса теста, попыток и завершённости уроков |
| `useQuizTimer.ts` | Обратный отсчёт времени теста с поддержкой сброса по `resetKey` и колбэком `onExpire` |
| `useQuizSecurity.ts` | Античит: реагирует на переключение вкладки, выход из полноэкранного режима, блокирует хоткеи DevTools (F12, Ctrl+Shift+I, Ctrl+U), блокирует кнопку «назад» |
| `useQuizSubmission.ts` | Отправка результатов теста на `/api/quiz/submit`, защита от повторной отправки через `finishedRef` |

---

## 8. API-роуты

### `POST /api/quiz/submit`

Единственный «настоящий» REST route проекта — вся остальная логика идёт напрямую через Supabase-клиент из Server Components.

**Файл:** `app/api/quiz/submit/route.ts`

**Тело запроса:**

```ts
{
  quizId: string
  attemptNum: number         // ожидаемый порядковый номер попытки
  userAnswers: Record<string, string[]>  // question_id → answer_id[] (или [текст] для text-вопросов)
  forceFail?: boolean        // принудительный незачёт (используется античитом при нарушении)
  timeSpentSec?: number
}
```

**Логика:**

```mermaid
flowchart TD
    Start([POST /api/quiz/submit]) --> Auth{Есть сессия?}
    Auth -- нет --> R401[401 Unauthorized]
    Auth -- да --> Validate{Валидное тело?\nquizId, attemptNum, userAnswers}
    Validate -- нет --> R400[400 Bad Request]
    Validate -- да --> AdminClient[createAdminClient\nservice-role, обход RLS]
    AdminClient --> LoadQuiz["SELECT quiz + questions + answers(is_correct)"]
    LoadQuiz --> Found{Тест найден?}
    Found -- нет --> R404[404 Not Found]
    Found -- да --> Attempts["getQuizAttemptsCount\n(сколько попыток уже сделано)"]
    Attempts --> Check{attemptNum == attemptsDone+1\nИ attemptsDone < max_attempts?}
    Check -- нет --> R409[409 Conflict:\nAttempt no longer available]
    Check -- да --> Force{forceFail === true?}
    Force -- да --> InsertZero["INSERT quiz_results\nscore=0, passed=false, status=reviewed"]
    InsertZero --> R200a["200: {passed:false, percent:0, pending:false}"]
    Force -- нет --> Calc["calculateQuizResult()\nсравнение userAnswers с is_correct"]
    Calc --> TextCheck{Есть заполненные\ntext-вопросы?}
    TextCheck -- да --> Pending["pending=true, status='pending'"]
    TextCheck -- нет --> Reviewed["status='reviewed',\npassed = percent >= passing_score"]
    Pending --> InsertResult["INSERT quiz_results"]
    Reviewed --> InsertResult
    InsertResult --> TextInsert{filledTextQuestions?}
    TextInsert -- да --> InsertText["INSERT text_answers\n(is_correct: null — на проверку админу)"]
    TextInsert -- нет --> R200b["200: {passed, percent, pending}"]
    InsertText --> R200b
```

Ключевые проверки безопасности внутри роута:
- `attemptNum` строго проверяется против реального числа попыток в БД (`getQuizAttemptsCount`) — клиент не может «подделать» номер попытки.
- Итоговый счёт всегда пересчитывается на сервере по данным из БД (`calculateQuizResult`), а не принимается от клиента.
- Ответы с `is_correct` читаются только через `createAdminClient()` — обычный пользователь не может получить эти данные напрямую (заблокировано RLS-политикой `answers read admin only`).

### `GET /auth/callback`

**Файл:** `app/auth/callback/route.ts` — обменивает `code` на сессию (`exchangeCodeForSession`), создаёт профиль при первом входе, редиректит по роли (см. диаграмму в разделе 4).

---

## 9. Ключевые пользовательские сценарии

### 9.1 Прохождение урока (manager)

1. `app/manager/topics/[id]/page.tsx` вызывает `getTopicPageData({ topicId, userId })`.
2. `buildTopicProgress` собирает `initialCompletedIds`, `attemptsLeft`, `quizDisplayStatus`.
3. `TopicPageClient` / `LessonList` используют `useTopicProgress` и `useLessonProgress` для клиентского состояния.
4. При просмотре урока → `useLessonProgress.markCompleted` → optimistic update UI → `completeLesson()` → upsert `lesson_progress` и пересчёт/upsert `topic_progress`.
5. При ошибке сети — откат оптимистичного состояния.

### 9.2 Прохождение теста (manager)

```mermaid
sequenceDiagram
    participant M as Manager (браузер)
    participant SC as QuizPageClient / QuizPlayer
    participant SEC as useQuizSecurity
    participant TMR as useQuizTimer
    participant SUB as useQuizSubmission
    participant API as /api/quiz/submit
    participant DB as Supabase (admin client)

    M->>SC: Открывает тест (QuizStartScreen)
    SC->>SEC: включает античит (fullscreen, visibility, popstate, devtools)
    SC->>TMR: запускает таймер (time_limit_sec)
    M->>SC: отвечает на вопросы (single/multiple/text)
    alt время истекло ИЛИ нарушение (смена вкладки/выход из fullscreen)
        SEC-->>SUB: submit({forceFail: true})
    else обычная сдача
        M->>SC: нажимает «Завершить»
        SC->>SUB: submit()
    end
    SUB->>API: POST userAnswers, attemptNum, timeSpentSec
    API->>DB: пересчёт результата, INSERT quiz_results (+text_answers если есть)
    API-->>SUB: {passed, percent, pending}
    SUB-->>SC: QuizResult (passed / pending / failed)
```

Вопросы с типом `text` не проверяются автоматически: результат теста получает `status='pending'`, пока администратор не проверит ответ на `/admin/text-answers`.

### 9.3 Проверка текстовых ответов (admin)

`app/admin/text-answers/page.tsx` + `TextAnswerReviewer.tsx` — список `text_answers` с `is_correct = null`, отсортированный по дате (`idx_text_answers_review`). Администратор выставляет `is_correct`, после чего соответствующий `quiz_results.status` должен перейти в `reviewed`, а `passed` — пересчитаться относительно `passing_score`.

### 9.4 Управление контентом (admin)

`/admin/topics/new` и `/admin/topics/[id]` (`AdminTopicEditor.tsx`) — создание/редактирование темы, уроков, материалов и теста с вопросами/ответами. `/admin/modules` — группировка тем в модули (категории) через таблицу `module_topics`.

### 9.5 Отчётность (admin)

`/admin/dashboard` и `/admin/reports` используют `getGlobalStats`, `getEmployeesUserPage`/`mapEmployees`, `calculateUserStats` для сводной статистики; `/admin/users/[id]` — детальная карточка сотрудника (`getUserDetails`).

---

## 10. Компонентная карта UI

| Область | Компоненты | Назначение |
|---|---|---|
| **Layout** | `Sidebar`, `DashboardShell`, `FloatingBackground` | Общий каркас: боковое меню (разный набор пунктов для admin/manager), анимированный фон |
| **Manager / Dashboard** | `DashboardStats`, `RecentQuizzes`, `TopicsSection` | Виджеты главной страницы менеджера |
| **Manager / Topics** | `TopicCard`, `LessonCard`, `TopicsHeader`, `TopicsEmpty` | Список тем и уроков |
| **Manager / Topic page** | `TopicHero`, `TopicProgress`, `QuizCard` | Заголовок темы, прогресс-бар, карточка перехода к тесту |
| **Manager / Quiz** | `QuizStartScreen`, `QuizPlayer`, `QuizHeader`, `QuizNavigation`, `QuizAnswers`, `QuizTextAnswer`, `QuizResult` | Полный флоу прохождения теста от старта до результата |
| **Manager / Modules** | `ModuleViewer` | Просмотр модуля (категории) со списком входящих тем |
| **Video** | `VideoPlayer` | Плеер видео-урока |
| **Admin / Modules** | `CreateModule`, `ModuleCard`, `ModuleTopicList`, `TopicPicker` | CRUD модулей и привязка тем к ним |
| **Admin / Employee cards** | `EmployeeCard`, `EmployeesGrid`, `RoleBadge` | Список сотрудников на `/admin/users` |
| **Admin / Employee stats** | `UserHeader`, `UserStatsGrid`, `TopicProgress`, `LessonProgress`, `QuizHistory` | Детальная карточка сотрудника `/admin/users/[id]` |
| **Skeletons** | `ManagerDashboardSkeleton`, `ManagerModulesSkeleton`, `ManagerModulSkeleton`, `ManagerTopicsSkeleton`, `ManagerResultSkeleton` | Состояния загрузки (Next.js `loading.tsx`) |

---

## 11. Установка и запуск

### Требования

- Node.js 20+ (см. `@types/node: ^20`)
- Аккаунт Supabase (проект с PostgreSQL)

### Шаги

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env.local (см. раздел 12)

# 3. Применить миграцию БД
#    В Supabase SQL Editor выполнить содержимое:
#    supabase/migrations/001_initial_schema.sql
#    (или через Supabase CLI: supabase db push)

# 4. Запустить dev-сервер
npm run dev
# → http://localhost:3000
```

### Назначение первого администратора

После того как первый пользователь зарегистрировался через `/auth/register` (по умолчанию получит роль `manager`), выполнить в Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

---

## 12. Переменные окружения

Файл `.env.local` в корне проекта:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

| Переменная | Где используется | Публичная? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server клиенты | да |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server клиенты (работают под RLS) | да |
| `SUPABASE_SERVICE_ROLE_KEY` | только `lib/supabase/admin.ts`, только в `app/api/quiz/submit/route.ts` | **нет, строго server-only** |

⚠️ `SUPABASE_SERVICE_ROLE_KEY` даёт полный доступ к БД в обход RLS. Никогда не должен попадать в клиентский бандл (не имеет префикса `NEXT_PUBLIC_`, поэтому Next.js не инлайнит его в браузер — но важно не использовать его вне серверных файлов).

---

## 13. Деплой

Проект — стандартное Next.js App Router приложение, деплоится на любую платформу с поддержкой Node.js Server Runtime / Edge Middleware (например, Vercel):

1. Подключить репозиторий к платформе деплоя.
2. Указать переменные окружения из раздела 12 в настройках проекта (все три, включая service-role — как server-only secret).
3. Build command: `npm run build`; Start command: `npm run start`.
4. Убедиться, что миграция `supabase/migrations/001_initial_schema.sql` применена к продакшн-инстансу Supabase **до** первого деплоя.
5. После первого релиза — назначить администратора (раздел 11).
6. `proxy.ts` (`export const config.matcher`) исключает статику (`_next/static`, `_next/image`, иконки, изображения) из мидлвар-обработки — дополнительная настройка CDN/edge не требуется.

---

## 14. Проверка перед деплоем

```bash
npm run lint
npm run build
```

Оба должны проходить без ошибок перед выкладкой в продакшн (зафиксировано в `README.md` проекта как обязательное требование).

---

## 15. Заметки по безопасности

- `proxy.ts` выполняет **оптимистичные** редиректы для авторизованных/admin-маршрутов — это UX-оптимизация, а не единственный барьер.
- Server-layouts (`app/admin/layout.tsx`, `app/manager/layout.tsx`) повторно проверяют auth и роль перед рендером защищённой области — это настоящая граница безопасности.
- Ответы теста (`answers.text`, без `is_correct`) очищаются функцией `sanitizeQuiz` перед отправкой в браузер.
- Итоговая проверка и начисление баллов теста выполняется **только на сервере** в `app/api/quiz/submit/route.ts`, с использованием аутентифицированной cookie-сессии + отдельного server-only Supabase-клиента с service-role ключом.
- RLS блокирует чтение `answers.is_correct` обычными пользователями; администраторы сохраняют полный доступ на управление контентом.
- Клиентский античит (`useQuizSecurity`) — это UX/сдерживающий механизм (блокировка DevTools-хоткеев, реакция на потерю фокуса вкладки/fullscreen), а не криптографическая защита; настоящая защита от читерства обеспечивается пересчётом результата на сервере.

---

## 16. Известные особенности кода

Эти моменты стоит иметь в виду при дальнейшей разработке — не баги в проде, но технический долг/шероховатости, замеченные при анализе:

- **`lib/manager/completeLesson.ts`** содержит дублирующийся блок upsert `topic_progress` — сначала он выполняется как самостоятельный `const { error: topicError } = ...` с явной обработкой ошибки, затем сразу следом ещё раз через `await supabase.from('topic_progress').upsert(...)` без обработки ошибки. Второй вызов избыточен и может быть удалён.
- **Смешение языков в комментариях**: часть модулей (`lib/manager/buildTopicProgress.ts`, `lib/manager/calcLessonsProgress.ts`, `api/getTopicPageData.ts`) документированы на украинском, часть (`lib/manager/completeLesson.ts`, `proxy.ts`) — на русском. Функционально не критично, но стоит унифицировать при рефакторинге.
- **Типизация `any`**: многие серверные data-fetch функции и калькуляторы (`enrichTopics`, `calculateUserStats`, `mapEmployees`, `buildTopicProgress`) используют `any[]` для сырых данных из Supabase вместо строгих типов из `types/index.ts`. При расширении схемы это увеличивает риск silent-ошибок.
- **`QuizCard` в `types/index.ts`** использует `quiz: any` и `quizResult: any | null` — типизация неполная по сравнению с остальными интерфейсами файла.
- **`AGENTS.md`** предупреждает, что установленная версия Next.js (16.2.4) — «not the Next.js you know», с возможными breaking changes относительно тренировочных данных LLM; при написании нового кода стоит сверяться с `node_modules/next/dist/docs/`.