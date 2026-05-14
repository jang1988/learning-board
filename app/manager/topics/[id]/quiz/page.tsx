import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import QuizPageClient from './QuizPageClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function QuizPage({ params }: PageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Загружаем тест
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select(`
      *,
      questions(
        *,
        answers(*)
      )
    `)
    .eq('topic_id', id)
    .maybeSingle()

  if (quizError) {
    console.error('QUIZ ERROR:', quizError)
  }

  // Если тест не найден
  if (!quiz) {
    notFound()
  }

  // Количество предыдущих попыток
  const { count: attemptsDone } = await supabase
    .from('quiz_results')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('user_id', user.id)
    .eq('quiz_id', quiz.id)

  const attemptNum = (attemptsDone ?? 0) + 1

  // Попытки закончились
  if (attemptNum > quiz.max_attempts) {
    redirect(`/manager/topics/${id}`)
  }

  // Сортировка вопросов и ответов
  const sortedQuiz = {
    ...quiz,

    questions: (quiz.questions ?? [])
      .sort(
        (a: any, b: any) =>
          (a.order_index ?? 0) - (b.order_index ?? 0)
      )
      .map((q: any) => ({
        ...q,

        answers: (q.answers ?? [])
          .sort(
            (a: any, b: any) =>
              (a.order_index ?? 0) - (b.order_index ?? 0)
          )
          .map(({ is_correct: _, ...answer }: any) => answer),
      })),
  }

  return (
    <QuizPageClient
      quiz={sortedQuiz}
      userId={user.id}
      topicId={id}
      attemptNum={attemptNum}
      attemptsLeft={quiz.max_attempts - attemptNum}
    />
  )
}