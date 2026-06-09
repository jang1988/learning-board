import { createClient } from '@/lib/supabase/server'
import { buildTopicProgress, TopicProgress } from '@/lib/manager/buildTopicProgress'

interface Params {
  topicId: string
  userId:  string
}

/**
 * Результат запиту даних для сторінки теми.
 * Поєднує сирі дані з БД і обчислений прогрес.
 */
export interface TopicPageData extends TopicProgress {
  topic:      any | null
  lessons:    any[]
  quiz:       any | null
  quizResult: any | null
}

/**
 * Завантажує всі дані для сторінки теми одним викликом.
 *
 * Використовує Promise.all для паралельного виконання незалежних запитів.
 * Результат теста запитується окремо — тільки якщо тест існує.
 *
 * @param topicId - UUID теми
 * @param userId  - UUID поточного користувача
 */
export async function getTopicPageData({ topicId, userId }: Params): Promise<TopicPageData> {
  const supabase = await createClient()

  // Паралельні запити — тема, уроки, тест
  const [topicRes, lessonsRes, quizRes] = await Promise.all([
    supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single(),

    supabase
      .from('lessons')
      .select(`
        *,
        materials(*),
        lesson_progress!left(status, completed_at, user_id)
      `)
      .eq('topic_id', topicId)
      .eq('lesson_progress.user_id', userId)
      .order('order_index'),

    supabase
      .from('quizzes')
      .select(`*, questions(count)`)
      .eq('topic_id', topicId)
      .maybeSingle(),
  ])

  const topic   = topicRes.data
  const lessons = lessonsRes.data ?? []
  const quiz    = quizRes.data ?? null

  // Результат тесту — тільки якщо тест існує
  let quizResult = null
  if (quiz?.id) {
    const { data } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quiz.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    quizResult = data
  }

  // Зводимо прогрес
  const progress = buildTopicProgress(lessons, quiz, quizResult)

  return { topic, lessons, quiz, quizResult, ...progress }
}
