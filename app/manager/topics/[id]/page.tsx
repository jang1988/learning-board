import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TopicPageClient from './TopicPageClient'

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: topic } = await supabase.from('topics').select('*').eq('id', id).single()
  if (!topic) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select(`*, materials(*), lesson_progress!left(status, completed_at)`)
    .eq('topic_id', id)
    .eq('lesson_progress.user_id', user.id)
    .order('order_index')

  const { data: quiz } = await supabase
    .from('quizzes')
    .select(`*, questions(count)`)
    .eq('topic_id', id)
    .maybeSingle()

  const { data: quizResult } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', user.id)
    .eq('quiz_id', quiz?.id ?? '')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lessonsTotal = lessons?.length ?? 0
  const lessonsDone = lessons?.filter(l => l.lesson_progress?.[0]?.status === 'completed').length ?? 0
  const allLessonsDone = lessonsTotal > 0 && lessonsDone === lessonsTotal
  const attemptsDone = quizResult?.attempt_num ?? 0
  const attemptsLeft = quiz ? quiz.max_attempts - attemptsDone : 0

  const isPending = quizResult?.status === 'pending'
  const isReviewed = quizResult?.status === 'reviewed'
  const hasPassed = quizResult?.passed === true

  const initialCompletedIds = lessons?.filter(l => l.lesson_progress?.[0]?.status === 'completed').map(l => l.id) ?? []

  return (
    <TopicPageClient
      topic={topic}
      lessons={lessons ?? []}
      quiz={quiz}
      quizResult={quizResult}
      initialCompletedIds={initialCompletedIds}
      userId={user.id}
      lessonsTotal={lessonsTotal}
      allLessonsDone={allLessonsDone}
      isPending={isPending}
      isReviewed={isReviewed}
      hasPassed={hasPassed}
      attemptsLeft={attemptsLeft}
    />
  )
}