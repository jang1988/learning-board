# Learning Board

Learning Board is an internal onboarding and learning platform built with Next.js App Router and Supabase.

## Stack

- Next.js 16.2 with App Router, Server Components, Route Handlers, and Proxy
- React 19
- TypeScript
- CSS Modules
- Supabase Auth, PostgreSQL, RLS, and SSR cookies

## Roles

- `manager`: views assigned learning content, completes lessons, takes quizzes, and tracks personal progress.
- `admin`: manages topics, lessons, modules, quiz content, employees, reports, and text-answer reviews.

## Environment

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It is required for secure quiz submission because correct answers are intentionally not readable by normal authenticated clients.

## Database

Run the migration:

```bash
supabase/migrations/001_initial_schema.sql
```

The migration creates:

- core learning tables: `topics`, `lessons`, `materials`, `quizzes`, `questions`, `answers`
- progress tables: `lesson_progress`, `topic_progress`, `quiz_results`, `text_answers`
- module tables: `modules`, `module_topics`
- `profiles` linked to `auth.users`
- RLS policies for manager/admin access
- an auth trigger that creates a default manager profile

After the first user signs up, promote the initial administrator in Supabase:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
```

Both commands should pass before deploying.

## Security Notes

- `proxy.ts` performs optimistic redirects for authenticated/admin routes.
- Server layouts still verify auth and role before rendering protected areas.
- Quiz answers are sanitized before reaching the browser.
- Quiz scoring is performed by `app/api/quiz/submit/route.ts` on the server, using the authenticated cookie session plus a server-only Supabase service role client.
- RLS blocks normal users from reading `answers.is_correct`; admins retain content-management access.
