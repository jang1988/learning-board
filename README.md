# OnBoard — Платформа обучения новых сотрудников

Next.js 14 + CSS Modules + Supabase

---

## Стек

- **Next.js 14** (App Router, Server Components)
- **CSS Modules** — все стили изолированы по компонентам
- **Supabase** — PostgreSQL + Auth + Storage + RLS
- **TypeScript** — полная типизация

---

## Роли пользователей

| Роль | Возможности |
|------|-------------|
| `manager` | Просмотр тем, видеоуроки, прохождение тестов, свой прогресс |
| `admin` | Управление темами/уроками/тестами, дашборд с аналитикой, управление сотрудниками |

---

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Создать проект в Supabase

Зайти на [supabase.com](https://supabase.com), создать новый проект.

### 3. Настроить переменные окружения

```bash
cp .env.local.example .env.local
```

Заполнить `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` из настроек проекта в Supabase (Settings → API).

### 4. Запустить миграцию БД

В Supabase Dashboard → SQL Editor выполнить содержимое файла:

```
supabase/migrations/001_initial_schema.sql
```

### 5. Создать первого администратора

1. Зарегистрироваться через `/auth/register`
2. В Supabase Dashboard → Table Editor → `profiles`
3. Найти свою запись и изменить `role` с `manager` на `admin`

### 6. Запустить проект

```bash
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000)

---

## Структура проекта

```

app/
│
├── layout.tsx
│
├── auth/
│   ├── auth.module.css
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
│
├── admin/
│   ├── layout.tsx
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── dashboard.module.css
│   │
│   ├── reports/
│   │   ├── page.tsx
│   │   └── reports.module.css
│   │
│   ├── users/
│   │   ├── page.tsx
│   │   └── users.module.css
│   │
│   └── topics/
│       ├── page.tsx
│       ├── topics.module.css
│       │
│       ├── new/
│       │   ├── page.tsx
│       │   └── new.module.css
│       │
│       └── [id]/
│           ├── page.tsx
│           ├── AdminTopicEditor.tsx
│           └── editor.module.css
│
├── manager/
│   ├── layout.tsx
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── dashboard.module.css
│   │
│   └── topics/
│       ├── page.tsx
│       ├── topics.module.css
│       │
│       └── [id]/
│           ├── page.tsx
│           ├── topic.module.css
│           ├── LessonList.tsx
│           │
│           └── quiz/
│               ├── page.tsx
│               ├── QuizPageClient.tsx
│               └── quiz.module.css
│
components/
│
├── layout/
│   ├── Sidebar.tsx
│   └── Sidebar.module.css
│
├── quiz/
│   ├── QuizPlayer.tsx
│   ├── QuizPlayer.module.css
│   ├── QuizResult.tsx
│   └── QuizResult.module.css
│
└── video/
    ├── VideoPlayer.tsx
    └── VideoPlayer.module.css
│
lib/
└── supabase/
    ├── client.ts
    └── server.ts
│
styles/
└── globals.css
│
public/
├── file.svg
├── globe.svg
├── vercel.svg
└── window.svg
│
types/
└── index.ts
│
.env.local
.gitignore
README.md
AGENTS.md
CLAUDE.md
package.json
package-lock.json
tsconfig.json
eslint.config.mjs
postcss.config.mjs
proxy.ts
```

---

## Схема базы данных

```
profiles          — пользователи (расширяет auth.users)
topics            — темы обучения
lessons           — видеоуроки (YouTube/Vimeo URL)
materials         — доп. материалы (PDF, ссылки)
quizzes           — тесты по темам
questions         — вопросы теста (single/multiple/text)
answers           — варианты ответов
lesson_progress   — прогресс по урокам
topic_progress    — прогресс по темам
quiz_results      — результаты тестов
```

Все таблицы защищены **Row Level Security (RLS)**:
- Менеджер видит только свои данные
- Администратор видит всё

---

## Видео

Поддерживаются ссылки формата:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://vimeo.com/VIDEO_ID`

---

## Дальнейшее развитие

- [ ] Уведомления (email при назначении темы)
- [ ] Экспорт отчётов в CSV/Excel
- [ ] Дедлайны для прохождения тем
- [ ] Загрузка файлов в Supabase Storage
- [ ] Комментарии к урокам
- [ ] Группы сотрудников / отделы
