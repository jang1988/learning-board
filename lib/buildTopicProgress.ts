import { calcLessonsProgress } from './calcLessonsProgress'

/**
 * Статус результату тесту з точки зору відображення.
 */
export type QuizDisplayStatus =
  | 'none'      // тест ще не проходився
  | 'pending'   // очікує перевірки текстових відповідей адміністратором
  | 'reviewed'  // перевірено, результат фінальний
  | 'passed'    // здано (reviewed + passed)
  | 'failed'    // не здано (reviewed + !passed)

/**
 * Зведений прогрес теми — уроки + тест.
 * Використовується у TopicPage для відображення статусів.
 */
export interface TopicProgress {
  // ── Уроки ────────────────────────────────────────────────────
  /** Загальна кількість уроків */
  lessonsTotal: number
  /** Кількість переглянутих уроків */
  lessonsDone: number
  /** true якщо всі уроки переглянуто */
  allLessonsDone: boolean
  /** Масив id переглянутих уроків для ініціалізації LessonList */
  initialCompletedIds: string[]

  // ── Тест ─────────────────────────────────────────────────────
  /** Кількість використаних спроб */
  attemptsDone: number
  /** Кількість спроб, що залишилися */
  attemptsLeft: number
  /** true якщо остання спроба очікує перевірки адміністратором */
  isPending: boolean
  /** true якщо остання спроба вже перевірена */
  isReviewed: boolean
  /** true якщо тест зданий (percent >= passing_score) */
  hasPassed: boolean
  /** Зведений статус для UI */
  quizDisplayStatus: QuizDisplayStatus
}

/**
 * Обчислює зведений прогрес теми на основі уроків і результату тесту.
 *
 * Використовується у `getTopicPageData` щоб зібрати всі похідні дані
 * в одному місці й не рахувати їх у компоненті.
 *
 * @param lessons    - масив уроків теми (з lesson_progress)
 * @param quiz       - об'єкт тесту або null якщо тесту немає
 * @param quizResult - останній результат тесту або null
 */
export function buildTopicProgress(
  lessons: any[],
  quiz: any | null,
  quizResult: any | null
): TopicProgress {
  // ── Прогрес уроків ───────────────────────────────────────────
  const lp = calcLessonsProgress(lessons)

  // ── Прогрес тесту ────────────────────────────────────────────
  const attemptsDone = quizResult?.attempt_num ?? 0
  const attemptsLeft = quiz
    ? Math.max(0, quiz.max_attempts - attemptsDone)
    : 0

  const isPending  = quizResult?.status === 'pending'
  const isReviewed = quizResult?.status === 'reviewed'
  const hasPassed  = quizResult?.passed === true

  // Зведений статус для зручності використання в JSX
  let quizDisplayStatus: QuizDisplayStatus = 'none'
  if (quizResult) {
    if (isPending)       quizDisplayStatus = 'pending'
    else if (hasPassed)  quizDisplayStatus = 'passed'
    else if (isReviewed) quizDisplayStatus = 'failed'
  }

  return {
    lessonsTotal:        lp.total,
    lessonsDone:         lp.done,
    allLessonsDone:      lp.isCompleted,
    initialCompletedIds: lp.completedLessons.map(l => l.id),

    attemptsDone,
    attemptsLeft,
    isPending,
    isReviewed,
    hasPassed,
    quizDisplayStatus,
  }
}
