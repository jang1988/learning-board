import { calcLessonsProgress } from '@/lib/manager/calcLessonsProgress'

/**
 * Статус проходження теми.
 * - not_started: жодного уроку не переглянуто
 * - in_progress:  частина уроків переглянута
 * - completed:    всі уроки переглянуто
 */
export type TopicStatus = 'not_started' | 'in_progress' | 'completed'

/**
 * Тема зі збагаченими полями прогресу.
 * Розширює вихідний об'єкт теми з БД.
 */
export interface EnrichedTopic {
  /** Кількість переглянутих уроків поточним юзером */
  lessonsDone: number
  /** Загальна кількість уроків у темі */
  lessonsTotal: number
  /** Відсоток проходження (0–100) */
  pct: number
  /** Статус проходження теми */
  status: TopicStatus
  [key: string]: any
}

/**
 * Збагачує масив тем даними про прогрес конкретного користувача.
 *
 * Призначений для списку тем, де lesson_progress містить
 * записи всіх юзерів (без фільтрації на рівні SQL).
 *
 * @param topics - масив тем з вкладеними lessons і lesson_progress
 * @param userId - ID поточного користувача
 */
export function enrichTopicsWithProgress(
  topics: any[],
  userId: string
): EnrichedTopic[] {
  return (
    topics?.map(topic => {
      const progress = calcLessonsProgress(topic.lessons ?? [], userId)

      const status: TopicStatus =
        !progress.isStarted  ? 'not_started' :
        progress.isCompleted ? 'completed'   : 'in_progress'

      return {
        ...topic,
        lessonsDone:  progress.done,
        lessonsTotal: progress.total,
        pct:          progress.percent,
        status,
      }
    }) ?? []
  )
}
