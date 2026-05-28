/**
 * Обчислює прогрес проходження уроків для одної теми.
 *
 * Підтримує два режими:
 * - Без userId: використовується на сторінці теми (lesson_progress вже
 *   відфільтровано по user_id на рівні SQL-запиту через .eq())
 * - З userId: використовується у списку тем (lesson_progress містить
 *   записи всіх користувачів, фільтруємо вручну)
 */
export function calcLessonsProgress(lessons: any[], userId?: string) {
  const total = lessons?.length ?? 0

  const completedLessons = lessons.filter(lesson => {
    const progress: any[] = lesson.lesson_progress ?? []

    // Режим сторінки теми — SQL вже повертає тільки записи поточного юзера
    if (!userId) {
      return progress[0]?.status === 'completed'
    }

    // Режим списку тем — шукаємо запис конкретного юзера вручну
    return progress.some(p => p.user_id === userId && p.status === 'completed')
  })

  const done    = completedLessons.length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return {
    /** Загальна кількість уроків у темі */
    total,
    /** Кількість переглянутих уроків */
    done,
    /** Відсоток завершення (0–100) */
    percent,
    /** Масив уроків зі статусом completed */
    completedLessons,
    /** true якщо всі уроки переглянуто */
    isCompleted: total > 0 && done === total,
    /** true якщо хоч один урок переглянуто */
    isStarted: done > 0,
  }
}
